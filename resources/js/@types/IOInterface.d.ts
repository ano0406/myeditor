//FileDatabaseの持つAjax通信機能、Cookie読み書きの機能をFileDataが利用する場合、このインスタンスのオブジェクトを利用する
type IOInterface = {
    sendAjaxGet:<ResponseData>(url:string) => Promise<ResponseData>;
    sendAjaxData:<RequestData,ResponseData>(url:string,reqtype:string,reqdata:RequestData) => Promise<ResponseData>;
    saveCookie:(id:number,data:CookiedFileData) => void;
    removeCookie:(id:number) => void;
};
