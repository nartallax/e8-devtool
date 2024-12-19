export const arrayLikeToArray = <T>(arr: {[index: number]: T, length: number}): T[] => {
	const result = new Array(arr.length)
	for(let i = 0; i < arr.length; i++){
		result[i] = arr[i]
	}
	return result
}