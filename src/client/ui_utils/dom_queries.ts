export function* domParentsOf(node: Node): IterableIterator<Node> {
	let parent = node.parentNode
	while(parent){
		yield parent
		parent = parent.parentNode
		if(parent === document.body){
			break
		}
	}
}

export function nodeOrParentThatMatches<T extends Node>(node: Node, matcher: (node: Node) => node is T): T | null
export function nodeOrParentThatMatches(node: Node, matcher: (node: Node) => boolean): Node | null
export function nodeOrParentThatMatches(node: Node, matcher: (node: Node) => boolean): Node | null {
	if(matcher(node)){
		return node
	}
	for(const parent of domParentsOf(node)){
		if(matcher(parent)){
			return parent
		}
	}
	return null
}

export const isInButton = (node: Node): boolean => !!nodeOrParentThatMatches(node, node => node instanceof HTMLButtonElement)