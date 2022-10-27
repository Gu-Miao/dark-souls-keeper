/**
 * A utility function to wrap a promise and make it returns a tuple
 * with error occured or result it keeps
 * @param promise The promise to wrap
 * @returns The tuple carring error or result
 */
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
