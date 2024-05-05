import {Entity} from "@nartallax/e8"
import {Entities, loader} from "dev_project/generated/resource_pack_content"

export const Box = loader.registerEntity(Entities.testBox, class Box extends Entity {})