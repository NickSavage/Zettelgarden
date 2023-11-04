export function EditPage({editingCard, setEditingCard, setInputBlurred, inputBlurred, renderWarningLabel, handleSaveCard}) {

    return (
	    <div>
	    <label htmlFor="title">Card ID:</label>
	    <div style={{ display: 'flex'}}>
	    <input
	type="text"
	value={editingCard.card_id}
	onChange={e => setEditingCard({ ...editingCard, card_id: e.target.value })}
	onBlur={() => setInputBlurred(true)}
	placeholder="ID"
	style={{ display: 'block', marginBottom: '10px' }} // Added styles here
	    />
	    {inputBlurred && renderWarningLabel()}
	</div>
	    {/* Title Section */}
	    <label htmlFor="title">Title:</label>
	    <input
	style={{ display: 'block', width: '100%', marginBottom: '10px' }} // Updated style here
	type="text"
	id="title"
	value={editingCard.title}
	onChange={e => setEditingCard({ ...editingCard, title: e.target.value })}
	placeholder="Title"
	    />
	    
	{/* Body Section */}
	    <label htmlFor="body">Body:</label>
	    <textarea
	style={{ display: 'block', width: '100%', height: '200px' }} // Updated style here
	id="body"
	value={editingCard.body}
	onChange={e => setEditingCard({ ...editingCard, body: e.target.value })}
	placeholder="Body"
	    />
	    
	    <label htmlFor="title">Is Reference:</label>
	    <input
	type="checkbox"
	id="is_reference"
	checked={editingCard.is_reference}
	onChange={e => setEditingCard({ ...editingCard, is_reference: e.target.checked })}
	style={{ marginBottom: '10px' }} // Updated style here
	    />
	    <label htmlFor="title">Link:</label>
	    <input
	style={{ display: 'block', width: '100%', marginBottom: '10px' }} // Updated style here
	type="text"
	id="link"
	value={editingCard.link}
	onChange={e => setEditingCard({ ...editingCard, link: e.target.value })}
	placeholder="Title"
	    />
	    <button onClick={handleSaveCard}>Save</button>
	    </div>
    )
}
