import {tag} from "@nartallax/cardboard-dom"
import * as css from "./collision_pairs_modal.module.scss"
import {project} from "client/client_globals"
import {WBox} from "@nartallax/cardboard"
import {BoolInput} from "client/component/bool_input/bool_input"
import {showModal} from "client/component/modal/modal"
import {Row} from "client/component/row_col/row_col"
import {UUID} from "crypto"
import {zeroUUID} from "common/uuid"

function makeKey(a: UUID, b: UUID): string {
	if(a > b){
		const tmp = a
		a = b
		b = tmp
	}
	return a + b
}

function splitKey(key: string): [UUID, UUID] {
	return [key.substring(0, zeroUUID.length) as UUID, key.substring(zeroUUID.length) as UUID]
}

export async function showCollisionPairsModal(): Promise<void> {
	const pairs = project.prop("collisionGroupPairs")
	const pairSet = pairs.map(
		pairs => new Set(pairs.map(([a, b]) => makeKey(a, b))),
		set => [...set].map(key => splitKey(key))
	)

	const boxesForKeys = new Map<string, WBox<boolean>>()
	const groups = project.get().collisionGroups // let's just assume that they won't change
	for(const group of groups){
		for(const otherGroup of groups){
			if(otherGroup.id < group.id){
				continue
			}
			const key = makeKey(group.id, otherGroup.id)
			const box = pairSet.map(set => set.has(key), checked => {
				const newSet = new Set(pairSet.get())
				if(!checked){
					newSet.delete(key)
				} else {
					newSet.add(key)
				}
				return newSet
			})
			boxesForKeys.set(key, box)
		}
	}

	const topRow = tag({
		class: css.topRow
	}, groups.map(group =>
		tag({class: css.labelWrap}, [tag({class: css.label}, [group.name])])
	))

	const otherRows = groups.map(group => tag({
		class: css.row
	}, [
		tag({class: css.label}, [group.name]),
		...groups.map(otherGroup => tag({class: css.cell}, [
			BoolInput({value: boxesForKeys.get(makeKey(group.id, otherGroup.id))!})
		]))
	]))

	const grid = tag({
		class: css.grid
	}, [
		topRow,
		...otherRows
	])

	const modal = showModal({
		title: "Collisions",
		align: "stretch"
	}, [
		Row(["Those checkboxes control if selected groups will collide or not."]),
		grid
	])

	await modal.waitClose()
}