// ブラウザが自分で差し込んだスクリプトのエラーを、Unity の読み込み失敗として扱わせないための処理。
//
// Unity のローダー（*.loader.js）は、window の error イベントをすべて受け取り、
// 読み込み中に届いたものは「読み込み失敗」として扱う。そのためダイアログが出て、
// 読み込み画面（Unity のロゴ）を消す処理が動かない。
//
// iPhone の Brave では、ウォレット機能が差し込むスクリプトが読み込み中にエラーを出す
// （PRJ-891 で確認、PRJ-916 で対処）。ゲームとは関係のない、次の 2 種類だけを止める。
//   1. ファイル名も行番号もない「Script error.」（中身を見られない別オリジンのスクリプトのエラー）
//   2. window.ethereum を含むエラー（ウォレット機能が差し込むスクリプトのエラー）
// それ以外のエラーと、読み込みの失敗（ダウンロードの失敗など）は、これまでどおり Unity に渡す。
//
// このファイルは、ローダーより先に読み込む。同じ window に登録したリスナーは登録順に呼ばれるので、
// ここで stopImmediatePropagation() すると、後から登録されるローダーのリスナーには届かない。
(function () {
  "use strict";

  function isInjectedBrowserError(event) {
    var message = String(event.message || "");

    var isOpaqueScriptError =
      message === "Script error." && !event.filename && !event.lineno && !event.error;
    if (isOpaqueScriptError) {
      return true;
    }

    return /\bwindow\.ethereum\b/.test(message);
  }

  window.addEventListener("error", function (event) {
    // 画像などの読み込み失敗（ErrorEvent ではない）は対象にしない。
    if (!(event instanceof ErrorEvent) || !isInjectedBrowserError(event)) {
      return;
    }

    event.stopImmediatePropagation();
    console.warn(
      "[SayaCatchesGen] ブラウザが差し込んだスクリプトのエラーを無視しました: " + event.message
    );
  });
})();
