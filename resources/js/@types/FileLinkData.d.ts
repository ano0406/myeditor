//ファイルのリンクをソートする際に用いるキー
type FileLinkSortkey = {
    name:string;
}

//FileLink.vueに渡す、表示のみに目的を絞ったデータ
type FileLinkData = {
    id:number;
    //表示文字列
    itemname:string;
    tags:ReadonlyArray<string>;
    //ファイルのソートに使うためのキー
    key:FileLinkSortkey;
};
