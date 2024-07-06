import {Form} from "client/components/form/form"
import {ValidatorSets} from "client/components/form/validators"
import {NumberInputField} from "client/components/number_input/number_input"
import {PathInputField} from "client/components/path_input/path_input_field"
import {useBeforeNavigation} from "client/components/router/routing_context"
import {Separator} from "client/components/separator/separator"
import {TextInputField} from "client/components/text_input/text_input_field"
import {UnsavedChanges, useUnsavedChanges} from "client/components/unsaved_changes_context/unsaved_changes_context"
import {useSaveableState} from "client/components/unsaved_changes_context/use_saveable_state"
import {useApi} from "client/parts/api_context"
import {CentralColumn} from "client/parts/layouts/central_column"
import {useProject} from "client/parts/project_context"

const scaleHint = `Size, in pixels, of one in-world unit on x1 zoom. Affects many things:
- Resolution of textures
- Granularity of physical hitboxes
- Physics calculation in runtime
- Zoom/magnification calculations
...and other small things.
`

export const SettingsPage = () => {
	const [project, setProject] = useProject()
	const {
		state: settings, setState: setSettings, isUnsaved, save
	} = useSaveableState(project.config, () => {
		setProject(project => ({...project, config: settings}))
	})

	const {saveOrAbort} = useUnsavedChanges()
	useBeforeNavigation(() => saveOrAbort({actionDescription: "navigate away"}))

	const [rootForest] = useApi(api => api.getProjectRootForest(), [])

	return (
		<CentralColumn width={["400px", "75vw", "800px"]}>
			<UnsavedChanges isUnsaved={isUnsaved} save={save}>
				<Form fieldLabelWidth="20rem" fieldInputWidth="30rem" showAllErrors>
					<Separator>General settings</Separator>
					<NumberInputField
						value={settings.inworldUnitPixelSize}
						onChange={inworldUnitPixelSize => setSettings(settings => ({...settings, inworldUnitPixelSize}))}
						label="Scale"
						hint={scaleHint}
						step={0.01}
						min={0.01}
					/>
					<Separator hint="All paths are calculated relative to directory that contains project definition file. It is advised to keep them relative for portability.">Paths</Separator>
					<PathInputField
						value={settings.textureDirectoryPath}
						onChange={textureDirectoryPath => setSettings(settings => ({...settings, textureDirectoryPath}))}
						label="Textures path"
						hint="Path to a directory that contains textures. You can only use textures from this directory in this devtool project."
						validators={ValidatorSets.nonEmpty}
						fsForest={rootForest}
						pathPrefix="./"
						canSelectDirectory
					/>
					<PathInputField
						value={settings.resourcePackPath}
						onChange={resourcePackPath => setSettings(settings => ({...settings, resourcePackPath}))}
						label="Resource pack path"
						hint="Path to autogenerated resource pack. Resource pack is binary file generated by devtool and loaded in runtime by the engine. Resource pack contains textures, sounds, hitboxes and other stuff you may edit in devtool."
						validators={ValidatorSets.nonEmpty}
						fsForest={rootForest}
						pathPrefix="./"
						canSelectDirectory
						canSelectFile
					/>
					<PathInputField
						value={settings.ts.path}
						onChange={path => setSettings(settings => ({...settings, ts: {...settings.ts, path}}))}
						label="Typescript bindings path"
						hint="Path to autogenerated file with Typescript bindings. Devtool will generate those bindings for you to use. Bindings describe contents of resource pack."
						validators={ValidatorSets.nonEmpty}
						fsForest={rootForest}
						pathPrefix="./"
						canSelectDirectory
						canSelectFile
					/>
					<PathInputField
						value={settings.entityClassesDirectoryPath}
						onChange={entityClassesDirectoryPath => setSettings(settings => ({...settings, entityClassesDirectoryPath}))}
						label="Entity classes path"
						hint="Path to a root directory with files that contain entity classes. Those files should end with .entity.ts. They will be included in autogenerated .ts file to ensure they are included in the build."
						validators={ValidatorSets.nonEmpty}
						fsForest={rootForest}
						pathPrefix="./"
						canSelectDirectory
					/>
					<Separator hint="Names of various identifiers in autogenerated TypeScript code.">Identifier names</Separator>
					<TextInputField
						value={settings.ts.entityEnumName}
						onChange={entityEnumName => setSettings(settings => ({...settings, ts: {...settings.ts, entityEnumName}}))}
						label="Entity enum"
						validators={ValidatorSets.nonEmpty}
					/>
					<TextInputField
						value={settings.ts.inputBindsEnumName}
						onChange={inputBindsEnumName => setSettings(settings => ({...settings, ts: {...settings.ts, inputBindsEnumName}}))}
						label="Input binds enum"
						validators={ValidatorSets.nonEmpty}
					/>
					<TextInputField
						value={settings.ts.loaderVariableName}
						onChange={loaderVariableName => setSettings(settings => ({...settings, ts: {...settings.ts, loaderVariableName}}))}
						label="Loader"
						validators={ValidatorSets.nonEmpty}
					/>
					<TextInputField
						value={settings.ts.particleEnumName}
						onChange={particleEnumName => setSettings(settings => ({...settings, ts: {...settings.ts, particleEnumName}}))}
						label="Particle enum"
						validators={ValidatorSets.nonEmpty}
					/>
				</Form>
			</UnsavedChanges>
		</CentralColumn>
	)
}