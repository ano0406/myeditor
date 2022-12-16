//ContextMenu.vueに渡すpropsの型
type ContextMenuProps = {
    items:Array<{
        name:string;
        action:() => void;
    }>;
    clientx:number;
    clienty:number;
};
