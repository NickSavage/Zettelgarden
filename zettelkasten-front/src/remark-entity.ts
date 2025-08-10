import { visit } from "unist-util-visit";
import { Node } from "unist";

export default function remarkEntity() {
    return (tree: Node) => {
        visit(tree, "text", (node: any, index: number | undefined, parent: any) => {
            if (!parent || typeof node.value !== "string" || index === undefined) return;

            const regex = /&ENTITY:([^:]+):([^&]+)&/g;
            let match;
            const newNodes: any[] = [];
            let lastIndex = 0;

            while ((match = regex.exec(node.value)) !== null) {
                const [fullMatch, id, name] = match;

                // Push text before match
                if (match.index > lastIndex) {
                    newNodes.push({
                        type: "text",
                        value: node.value.slice(lastIndex, match.index),
                    });
                }

                // Push entity node
                newNodes.push({
                    type: "entity",
                    data: {
                        id,
                        name,
                        hName: "span",
                        hProperties: {
                            className: "entity",
                            "data-id": id,
                            "data-name": name
                        }
                    },
                    children: [{ type: "text", value: name }],
                });

                lastIndex = match.index + fullMatch.length;
            }

            // Push remaining text after last match
            if (lastIndex < node.value.length) {
                newNodes.push({
                    type: "text",
                    value: node.value.slice(lastIndex),
                });
            }

            if (newNodes.length > 0) {
                parent.children.splice(index, 1, ...newNodes);
                return index + newNodes.length;
            }
        });
    };
}
