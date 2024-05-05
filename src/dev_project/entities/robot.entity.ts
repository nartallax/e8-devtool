import {Entity} from "@nartallax/e8"
import {Entities, loader} from "dev_project/generated/resource_pack_content"

export const Robot = loader.registerEntity(Entities.robot, class Robot extends Entity {})