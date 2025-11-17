import { Paperclip, Download, Eye } from "lucide-react";

const renderDocument = (name: string, url?: string) => {
    const handleDownload = async (fileUrl: string, fileName: string) => {
        try {
            const response = await fetch(fileUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch file');
            }
            
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading file:', error);
            // Fallback: open in new tab
            window.open(fileUrl, '_blank');
        }
    };
    const getFileIcon = (fileName: string) => {
      const extension = fileName.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'pdf':
          return '📄';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          return '🖼️';
        case 'doc':
        case 'docx':
          return '📝';
        default:
          return '📎';
      }
    };

    const getFileType = (fileName: string) => {
      const extension = fileName.split('.').pop()?.toLowerCase();
      return extension ? extension.toUpperCase() : 'FILE';
    };

    return (
      <div className="group flex items-center bg-white border border-gray-200 rounded-[10px] p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-blue-50 rounded-[10px] flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-200 flex-shrink-0">
            <span className="text-lg">{getFileIcon(name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {getFileType(name)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-[4px] transition-colors duration-200"
              title="Ver documento"
            >
              <Eye size={16} />
            </a>
          )}
          {url && (
            <button
              onClick={() => handleDownload(url, name)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-[4px] transition-colors duration-200"
              title="Descargar documento"
            >
              <Download size={16} />
            </button>
          )}
        </div>
      </div>
    );
};  

export default renderDocument;