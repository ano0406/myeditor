import FileData from "./FileData";
import FileDatabase from "./FileDatabase";

export default class DeletedFile extends FileData{
    constructor(id:number,name:string,filedatabase:FileDatabase){
        super(id,name,filedatabase);
    }
    public onSync(){
        return this.filedatabase.sendAjaxData<{},{success:boolean}>(`/rest/${this.id}`,'delete',{})
        .then(_ => {
            return undefined;
        });
    }
}
