import DeletedFile from "./DeletedFile";
import FileData from "./FileData";
import FileManager from "./FileManager";

export default class FetchedFileData extends FileData{
    private edited;
    private renamed;
    private _text;
    public get text(){
        return this._text;
    }
    public set text(newtext:string){
        this._text = newtext;
        this.edited = true;
    }
    public get name(){
        return this._name;
    }
    public set name(newname:string){
        this.renamed = true;
        this._name = newname;
    }
    constructor(id:number,name:string,text:string,filemanager:FileManager,renamed:boolean = false){
        super(id,name,filemanager);
        this.edited = false;
        this._text = text;
        this.renamed = renamed;
    }
    public textareaDisable(){
        return false;
    }
    public fileLinkDisplayName(){
        return (this.edited?'*':'')+this._name;
    }
    public onDelete(): void {
        this.filemanager.changeFileData(this.id,new DeletedFile(this.id,this._name,this.filemanager));
    }
    public onSync(): void {
        if(this.edited || this.renamed){
            const data:{name?:string,text?:string} = {};
            if(this.edited){
                data.text = this.text;
            }
            if(this.renamed){
                data.name = this.name;
            }
            this.filemanager.sendAjaxData<{name?:string,text?:string},{success:boolean}>(`/rest/${this.id}`,'put',data,(res)=>{
                if(res.success){
                    this.edited = false;
                    this.renamed = false;
                }
            });
        }
    }
}
