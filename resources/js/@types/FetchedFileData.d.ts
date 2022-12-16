//サーバーから取り出した個々のファイルに対し保持する情報
//TODO:先の機能追加でどうなるかいまいち分からないので一応idを含めているが、いらなくなったら消す
type FetchedFileData = {
    id:number;
    name:string;
    text:string;
    edited:boolean;
    renamed:boolean;
};
