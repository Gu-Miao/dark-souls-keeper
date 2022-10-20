export function to<T>(promise: Promise<T>): Promise<[null, T] | [any]> {
  return new Promise((reslove, reject) => {
    promise
      .then(res => {
        reslove([null, res])
      })
      .catch(err => {
        reject([err])
      })
  })
}
