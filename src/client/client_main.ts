import {PromanApi} from "client/proman_api_client"
import "../fonts/opensans.scss" // cannot be imported from scss, otherwise paths will break
import "./proman_style_root.scss"
import {promanProject, textureFiles as allTextureFiles, promanConfigFile} from "client/proman_client_globals"
import {ModelPage} from "client/pages/model/model_page"
import {initializeCardboardDom, urlBox, waitDocumentLoaded} from "@nartallax/cardboard-dom"
import {attachUiHotkey} from "common/ui_hotkey"
import {Spinner} from "client/component/spinner/spinner"
import {showToast} from "client/component/toast/toast"
import {Icon} from "generated/icons"
import {box} from "@nartallax/cardboard"
import {Tabs} from "client/component/tabs/tabs"
import {Router} from "client/component/router/router"
import {Col} from "client/component/row_col/row_col"
import {AtlasPage} from "client/pages/atlas/atlas_page"
import {InputBindPage} from "client/pages/input_bind/input_bind_page"
import {getRandomUUID} from "common/uuid"
import {CollisionGroupsPage} from "client/pages/collision_groups/collision_groups_page"
import {LayersPage} from "client/pages/layers/layers_page"
import {groupBy} from "common/group_by"
import {ParticlesPage} from "client/pages/particles/particles_page"

async function main(): Promise<void> {
	await waitDocumentLoaded()
	await initializeCardboardDom()

	const spinner = Spinner({size: "big"})
	document.body.append(spinner)

	await loadProject()

	spinner.remove()
	document.body.appendChild(Root())

	addSaveHotkey()
}

const Root = () => {
	const path = urlBox(document.body, {path: true})

	return Col({padding: "top", align: "stretch", grow: 1}, [
		Tabs({
			selected: path,
			options: [
				{label: "Models", value: "/"},
				{label: "Atlas", value: "/atlas"},
				{label: "Input binds", value: "/input_binds"},
				{label: "Layers", value: "/layers"},
				{label: "Collisions", value: "/collision_groups"},
				{label: "Particles", value: "/particles"}
			]
		}),
		Router({
			grow: 1,
			align: "stretch",
			routes: {
				"/": () => ModelPage(),
				"/atlas": () => AtlasPage(),
				"/input_binds": () => InputBindPage(),
				"/layers": () => LayersPage(),
				"/collision_groups": () => CollisionGroupsPage(),
				"/particles": () => ParticlesPage()
			}
		})
	])
}

async function loadProject(): Promise<void> {
	// eslint-disable-next-line prefer-const
	let [project, textures, config] = await Promise.all([
		PromanApi.getProject(),
		PromanApi.getTextureFiles(),
		PromanApi.getConfigFile()
	])

	if(project.collisionGroups.length === 0){
		project = {
			...project,
			collisionGroups: [{id: getRandomUUID(), name: "default"}]
		}
	}
	for(const [type, layers] of groupBy(project.layers, layer => layer.type)){
		if(layers.length === 0){
			project = {
				...project,
				layers: [{id: getRandomUUID(), name: "default", type: type}]
			}
		}
	}

	promanProject.set(project)
	allTextureFiles.set(textures)
	promanConfigFile.set(config)
}

function addSaveHotkey(): void {
	attachUiHotkey(
		document.body,
		e => (e.ctrlKey || e.metaKey) && e.code === "KeyS",
		async e => {
			e.preventDefault()
			const completed = box(false)
			const toast = showToast({
				preventClickRemove: true,
				icon: completed.map(completed => completed ? Icon.check : Icon.spinner),
				text: completed.map(completed =>
					completed ? "Saving the project and generating files..." : "Saved and generated everything!"
				)
			})

			try {
				// this code is duplicated on backend
				await PromanApi.saveAndProduce(promanProject.get())
				completed.set(true)
				setTimeout(() => {
					toast.remove()
				}, 1500)
			} catch(e){
				console.error(e)
				toast.remove()
			}
		})
}

void main()
