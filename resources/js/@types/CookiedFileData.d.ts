//Cookieに保存する1ファイル単位の情報
type CookiedFileData = {
    //ファイル一覧に表示される際の、表示名
    itemname:string;
    //表示名をクリックしたとき右のtextareaで開けるか否か
    openable:boolean;
    //textareaで開いたとき表示するテキスト(openableがtrueのときのみ参照される)
    text?:string;
};
