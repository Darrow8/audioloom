export interface FileAsset {
    uri: string;
    name: string;
    size: number;
    mimeType: string;
    lastModified?: number;
}

export interface DocumentPickerHook {
    fileAsset: FileAsset | null;
    isLoading: boolean;
    promptIOSPicker: () => Promise<void>;
    setFileAsset: (fileAsset: FileAsset | null) => void;
}

export interface DocumentPickerProps {
    onFileSelect?: (file: FileAsset | null) => void;
    buttonTitle?: string;
}