import typesense

# Configure client
client = typesense.Client({
    'nodes': [{
        'host': '192.168.0.93',
        'port': '8108',
        'protocol': 'http'
    }],
    'api_key': 'chamber',  # Replace with your actual Typesense API key
    'connection_timeout_seconds': 2
})

def get_total_documents():
    try:
        stats = client.collections['search_v1'].retrieve()
        total_docs = stats['num_documents']
        print(f"Total documents in 'search_v1': {total_docs}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_total_documents()

    