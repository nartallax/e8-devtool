// this is the place to put various exotic module declarations in

declare module "*.css" {
	const css: {[key: string]: string}
	export = css
}

declare module "*.module.css" {
	const css: {[key: string]: string}
	export = css
}

declare module "*.bin" {
	const binFileUrl: string
	export default binFileUrl
}

declare module "*.glsl" {
	const shaderCode: string
	export default shaderCode
}

declare module "*.svg" {
	const svgPath: string
	export default svgPath
}