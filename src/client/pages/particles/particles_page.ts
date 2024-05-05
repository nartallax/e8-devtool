import {NamedIdList} from "client/component/named_id_list/named_id_list"
import {TwoColumnLayout} from "client/component/two_column_layout/two_column_layout"
import {promanProject} from "client/proman_client_globals"

export const ParticlesPage = () => {
	return TwoColumnLayout({
		grow: 1,
		backgroundChildren: [],
		foregroundChildren: [
			NamedIdList({
				itemName: "particle",
				items: promanProject.prop("particles")
			})
		]
	})
}