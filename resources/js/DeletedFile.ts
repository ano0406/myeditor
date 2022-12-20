import FileData from "./FileData";
import FileDatabase from "./FileDatabase";

export default class DeletedFile extends FileData{
    constructor(id:number,name:string,filedatabase:FileDatabase){
        super(id,name,filedatabase);
        filedatabase.saveCookie(id,{
            itemname:`削除:${name}`,
            openable:false,
        });
    }
    public onSync(){
        return this.filedatabase.sendAjaxData<{},{success:boolean}>(`/rest/${this.id}`,'delete',{})
        .then(_ => {
            this.filedatabase.removeCookie(this.id);
            return undefined;
        });
    }
}
