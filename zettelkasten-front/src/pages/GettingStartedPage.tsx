import React from "react";

export function GettingStartedPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome to Zettelgarden! 🌱</h1>
      <p className="text-lg mb-8">
        Welcome to your knowledge garden! Zettelgarden is designed to help you grow and nurture your ideas,
        create meaningful connections, and transform information into structured knowledge.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">📝 Cards - Your Knowledge Building Blocks</h2>
        <p className="mb-4">
          Cards are the fundamental building blocks of your knowledge garden. Each card represents a single idea, concept, or piece of information.
          You can:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Create new cards for any type of content</li>
          <li>Link cards together to create knowledge networks</li>
          <li>Add tags to organize your thoughts</li>
          <li>Create hierarchical relationships between cards</li>
          <li>Use markdown formatting for rich content</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">🏷️ Tags - Smart Organization</h2>
        <p className="mb-4">
          Tags help you categorize and organize your cards by type:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Use tags like "reference", "book", or "meeting"</li>
          <li>Filter and search cards by tags</li>
          <li>Create your own custom tag system</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">✅ Tasks - Turn Knowledge Into Action</h2>
        <p className="mb-4">
          Transform your knowledge into actionable items:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Create tasks directly from your cards</li>
          <li>Track progress on your projects</li>
          <li>Set priorities and due dates</li>
          <li>Organize tasks into projects and sprints</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">📁 Files - Attach and Manage</h2>
        <p className="mb-4">
          Attach and manage files seamlessly:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Upload documents, images, and other files to your cards</li>
          <li>Preview attachments directly in the interface</li>
          <li>Keep all your resources organized alongside your notes</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">🤖 Entities - AI-Powered Insights</h2>
        <p className="mb-4">
          Entities are AI-powered insights from your cards:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Automatically extract key concepts and relationships</li>
          <li>Discover connections between your notes</li>
          <li>Build a network of related ideas</li>
        </ul>
      </section>

      <section className="mt-12 p-6 bg-green-50 rounded-lg border border-green-200">
        <h2 className="text-2xl font-semibold mb-4">🌿 Getting Started</h2>
        <ol className="list-decimal ml-6 space-y-3">
          <li>Create your first card by clicking the "+" button</li>
          <li>Try linking this card to an existing card</li>
          <li>Experiment with different card types and relationships</li>
          <li>Use the search function to explore your growing knowledge base</li>
        </ol>
      </section>

      <section className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Need More Help?</h2>
        <p>
          This is just an overview of Zettelgarden's features. For more detailed information,
          hover over interface elements to see tooltips or explore the interface.
        </p>
      </section>
    </div>
  );
}
