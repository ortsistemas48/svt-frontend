import { Paperclip } from "lucide-react";

const renderDocument = (name: string) => {
    return (<div className="flex items-center justify-between border rounded px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <Paperclip size={16} />
        <span>{name}</span>
      </div>
    </div>)
};  

export default renderDocument;