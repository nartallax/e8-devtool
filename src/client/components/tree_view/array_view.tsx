import {TreeViewWithCreationProps, TreeViewWithElementCreation} from "client/components/tree_view/tree_view_with_element_creation"
import {useMemo} from "react"

type ParentProps<T> = TreeViewWithCreationProps<T, never>

type Props<T> = Pick<ParentProps<T>, "InlineEditor"> & {
	itemName: string
	values: T[]
	setValues: (newValues: T[]) => void
	getLabel: (value: T) => string
	createItem: (name: string) => T
	renameItem: (item: T, newName: string) => T
	getKey: (item: T) => string
	onItemClick?: (item: T) => void
	onItemDoubleclick?: (item: T) => void
	nameValidators?: ParentProps<T>["leafLabelValidators"]
}

export function ArrayView<T>({
	itemName, createItem, renameItem, values, setValues, getLabel, getKey, nameValidators, onItemClick, onItemDoubleclick, ...props
}: Props<T>) {
	const tree = useMemo(() => values.map(value => ({value})), [values])

	return (
		<TreeViewWithElementCreation
			{...props}
			tree={tree}
			itemName={itemName}
			onRename={(path, name) => {
				const index = path[0]!
				const newValues = [...values]
				newValues[index] = renameItem(values[index]!, name)
				setValues(newValues)
			}}
			onLeafCreated={name => setValues([createItem(name), ...values])}
			getLeafKey={getKey}
			getLeafLabel={getLabel}
			onLeafClick={onItemClick}
			onLeafDoubleclick={onItemDoubleclick}
			getSearchText={item => getLabel(item)}
			onDrag={(from, to) => setValues(moveItemByIndex(values, from[0]!, to[0]!))}
			onDelete={path => setValues(deleteItemByIndex(values, path[0]!))}
			leafLabelValidators={nameValidators}
		/>
	)
}

function deleteItemByIndex<T>(values: T[], index: number): T[] {
	return [...values.slice(0, index), ...values.slice(index + 1)]
}

function addItemByIndex<T>(values: T[], item: T, index: number): T[] {
	return [...values.slice(0, index), item, ...values.slice(index)]
}

function moveItemByIndex<T>(values: T[], from: number, to: number): T[] {
	const item = values[from]!
	if(from < to){
		to--
	}
	values = deleteItemByIndex(values, from)
	values = addItemByIndex(values, item, to)
	return values
}