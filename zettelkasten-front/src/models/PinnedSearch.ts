export interface PinnedSearch {
    id: number;
    title: string;
    searchTerm: string;
    searchConfig: {
        useClassicSearch: boolean;
        useFullText: boolean;
        onlyParentCards: boolean;
        showEntities: boolean;
        showPreview: boolean;
        sortBy: string;
    };
    created_at: Date;
}
