import FileData from "./FileData";

export default class DeletedFile extends FileData{
    constructor(id:number,name:string,io:IOInterface){
        super(id,name,[],io);
        io.saveCookie(id,{
            itemname:`削除:${name}`,
            openable:false,
        });
    }
    public onSync(){
        return this.io.sendAjaxData<{},{}>(`/rest/${this.id}`,'delete',{})
        .then(_ => {
            this.io.removeCookie(this.id);
            return undefined;
        });
    }
}
