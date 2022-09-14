const createImage = (url: string) =>
    new Promise<any>((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', error => reject(error))
        image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
        image.src = url
    })

function getRadianAngle(degreeValue: number) {
    return (degreeValue * Math.PI) / 180
}

export default async function getCroppedImg(imageSrc: string, pixelCrop: any, rotation: number = 0) {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    const maxSize = Math.max(image.width, image.height)
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

    // set each dimensions to double largest dimension to allow for a safe area for the
    // image to rotate in without being clipped by canvas context
    canvas.width = safeArea
    canvas.height = safeArea

    // translate canvas context to a central location on image to allow rotating around the center.
    ctx.translate(safeArea / 2, safeArea / 2)
    ctx.rotate(getRadianAngle(rotation))
    ctx.translate(-safeArea / 2, -safeArea / 2)

    // draw rotated image and store data.
    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    )
    const data = ctx.getImageData(0, 0, safeArea, safeArea)

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // paste generated rotate image with correct offsets for x,y crop values.
    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    )

    // As Base64 string
    return canvas.toDataURL('image/jpeg');

    // As a blob
    // return new Promise(resolve => {
    //     canvas.toBlob(file => {
    //         resolve(URL.createObjectURL(file))
    //     }, 'image/jpeg')
    // })
}

export function dataURLtoFile(base64: string, fileName: string) {

    var arr = base64.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], fileName, { type: mime });
}

export function validateAllowedFileType(fileType: string, allowedTypes: string[]) {
    // if types are not specified - assume all are allowed
    if (allowedTypes.length == 0) return true

    // check if file type is allowed 
    let isAllowed = allowedTypes.find(t => t == fileType)
    if (isAllowed) return true

    // get base type 
    let [base, type] = fileType.split("/")

    // find in allowed types based on base type 
    let allowed = allowedTypes.filter(t => t.startsWith(base))
    if (allowed.length == 0) return false

    // check if all subtypes are allowed 
    let allowedAll = allowed.find(t => t == [base, "*"].join("/"))
    return allowedAll != undefined
}


export function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return uuid;
}