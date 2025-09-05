import React from "react";

export function GettingStartedPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome to Zettelgarden! 🌱</h1>
      <p className="text-lg mb-8">
        Welcome to your knowledge garden! Zettelgarden is an open-source personal knowledge management system
        that preserves human insight while leveraging modern technology. Built on zettelkasten principles,
        it helps you develop and maintain your own understanding of the world.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">🤖 AI-Powered Analysis & Summarization</h2>
        <p className="mb-4">
          While other tools rush to automate everything with LLMs, Zettelgarden
          takes a measured approach. AI features are designed to augment your
          thinking process, not replace it. Our summarization pipeline delivers both
          high-level insights through executive summaries and detailed evidence-driven
          reference summaries with theses, arguments, and facts — helping you see the big
          picture without losing important nuance.
        </p>
        <p className="mb-4">
          Transform dense articles, podcasts, or research into clear two-part outputs:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>
            <strong>Executive Summaries:</strong> Concise, strategic, and outcome-focused summaries for decision-makers.
          </li>
          <li>
            <strong>Reference Summaries:</strong> Detailed, factual, and precise summaries with ranked arguments and verifiable facts for researchers.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">🔬 Facts & Entities - Granular Insights</h2>
        <p className="mb-4">
          Go beyond high-level summaries and explore the building blocks of knowledge:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>
            <strong>Entities:</strong> Automatically identify and extract key concepts, people, places, and organizations from your notes to reveal hidden connections.
          </li>
          <li>
            <strong>Facts:</strong> Automatically pull out discrete, verifiable statements (like statistics, events, or claims of evidence) from your source material, allowing you to build arguments on a solid foundation.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">📝 Cards - Your Knowledge Building Blocks</h2>
        <p className="mb-4">
          Cards are the fundamental building blocks of your knowledge garden. Each card represents a single idea, concept, or piece of information.
          You can:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>Create new cards for any type of content</li>
          <li>Link cards together to create knowledge networks</li>
          <li>Create hierarchical relationships between cards</li>
          <li>Use markdown formatting for rich content</li>
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

      <section className="mt-12 p-6 bg-green-50 rounded-lg border border-green-200">
        <h2 className="text-2xl font-semibold mb-4">🌿 Getting Started</h2>
        <ol className="list-decimal ml-6 space-y-3">
          <li>Create your first card by clicking the "+" button</li>
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
