import FileData from "./FileData";
import FileManager from "./FileManager";

export default class DeletedFile extends FileData{
    constructor(id:number,name:string,filemanager:FileManager){
        super(id,name,filemanager);
    }
    public onSync(){
        this.filemanager.sendAjaxData<{},{success:boolean}>(`/rest/${this.id}`,'delete',{},(res) => {
            if(res.success){
                this.filemanager.deleteFileData(this.id);
            }
        });
    }
}
