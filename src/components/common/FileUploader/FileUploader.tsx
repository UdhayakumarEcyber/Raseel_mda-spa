import classNames from 'classnames';
import * as React from 'react';
import { AsyncButton, Button, Modal, useToast } from 'uxp/components';
import { IContextProvider } from '../../../uxp';
import { generateUUID, validateAllowedFileType } from './FileUploadHelper';


interface IFileUploaderProps {
    uxpContext: IContextProvider,
    defaultImage?: string,
    pathToUpload: string,
    allowedTypes?: string[]
    crop?: {
        enble?: boolean,
        imageRatio?: number,
    },
    enableUrlInput?: boolean,
    afterUpload: (fileReference: IFileReference, reference?: string, preview?: string, type?: string) => void,
}

interface IFileReference {
    ContentLength: number;
    Metadata: {
        Account: string
        apikey: string
    }
    Name: string
    Provider: number
    Reference: string
}

type IView = "uploader" | "cropper"

const MB = 1 * 1024 * 1024;
const CHUNK_SIZE = 5 * MB;

const NoPreview = 'https://s3.ap-southeast-1.amazonaws.com/spaceworx.marketplace/assets/no-review-text.jpg'
const videoPreview = 'https://s3.ap-southeast-1.amazonaws.com/spaceworx.marketplace/assets/video-preview.png'

const FileUploader: React.FunctionComponent<IFileUploaderProps> = (props) => {

    let { defaultImage, afterUpload, pathToUpload, allowedTypes, uxpContext } = props

    let [view, setView] = React.useState<IView>("uploader")
    let [show, setShow] = React.useState<boolean>(false)
    let [previewImage, setPreviewImage] = React.useState<string>("")
    let [data, setData] = React.useState<{ file: File | null, type: string }>({ file: null, type: '' })
    let [progress, setProgress] = React.useState<number>(0)

    let Toast = useToast();


    let fileInputRef = React.useRef(null)
    let urlInputRef = React.useRef(null)

    React.useEffect(() => {
        if (!show) {
            setView("uploader")
            setPreviewImage(defaultImage)
            setData({ file: null, type: null })
        }
    }, [show])

    React.useEffect(() => {
        setPreviewImage(defaultImage)
    }, [defaultImage])


    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        try {
            setPreviewImage('')
            let selectedFiles = e.target.files

            // validate file type 
            let isAllowed = validateAllowedFileType(selectedFiles[0].type, allowedTypes)

            if (isAllowed) {
                let reader: FileReader = new FileReader()

                reader.onloadend = (evt) => {
                    if (selectedFiles[0].type.startsWith('image/')) {
                        console.log("is an image");
                        setPreviewImage(evt.target.result as string)
                    }
                    else if (selectedFiles[0].type.startsWith('video/')) {
                        console.log("is video");
                        setPreviewImage(videoPreview)
                    }
                    else {
                        setPreviewImage(NoPreview)
                    }
                }
                reader.readAsDataURL(selectedFiles[0])
                setData({ file: selectedFiles[0], type: selectedFiles[0].type })
            }
            else {
                Toast.error("This file type is not allowed")
            }
        }
        catch (e) {
            // console.log("Exception reading file, ", e)
            Toast.error("Something ent wrong")
        }
    }

    function addQSToURL(url: string, qs: any) {
        let result = url.lastIndexOf("?") === -1 ? url + "?" : url;
        let qsArray = [];

        if (!!url && !!qs) {
            for (let key in qs) {
                qsArray.push(`${key}=${qs[key]}`);
            }
        }
        return result + qsArray.join("&");
    }

    async function uploadChunk(url: string, filename: string, apikey: string, buffer: Blob) {
        const form = new FormData();
        form.append('file', buffer, filename);

        let response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `${apikey}`
            },
            body: form
        });

        let responseText = await response.text();

        // something went wrong, no point proceeding
        if (response.status !== 200) {
            throw responseText;
        }

        return responseText;
    }

    async function onClickUpload() {
        return new Promise<any>(async (done, nope) => {

            try {
                if (data.file) {
                    let file = data.file
                    let size = file.size
                    let name = file.name
                    let ext = name.slice((Math.max(0, name.lastIndexOf(".")) || Infinity) + 1)
                    name = "file-" + generateUUID() + '.' + ext
                    let identifier = `${size}-${name}`
                    let numOfChunks = Math.floor(size / CHUNK_SIZE) + 1
                    let uploadToken = generateUUID()

                    let baseUrl = uxpContext.lucyUrl + 'filemanager/upload/' + pathToUpload
                    let apikey = uxpContext.apiKey
                    // console.log(numOfChunks, baseUrl, apikey, uploadToken);

                    for (let i = 0; i < numOfChunks; i++) {
                        let url = addQSToURL(baseUrl, {
                            resumableChunkNumber: i,
                            resumableFilename: name,
                            uploadToken
                        });


                        let availableResponse = await fetch(url, {
                            method: "GET",
                            headers: {
                                "Authorization": `${apikey}`
                            }
                        });

                        setProgress(Math.floor((i / numOfChunks) * 100))

                        if (availableResponse.status === 200) {
                            // go to next chunk
                        }
                        // we are good to read the next chunk and upload to server
                        else if (availableResponse.status === 404) {
                            // get chunck 
                            let chunk = file.slice((i * CHUNK_SIZE), (i * CHUNK_SIZE) + CHUNK_SIZE, file.type)

                            url = addQSToURL(baseUrl, {
                                resumableChunkNumber: i,
                                resumableFilename: name,
                                resumableChunkSize: CHUNK_SIZE,
                                resumableTotalSize: size,
                                resumableIdentifier: identifier,
                                resumableTotalChunks: numOfChunks,
                                uploadToken
                            });

                            let response = await uploadChunk(url, name, apikey, chunk);
                            // console.log("response ", response);

                            if (i == numOfChunks - 1) {
                                // afterUpload()
                                let res : IFileReference = JSON.parse(response)
                                afterUpload(res, res.Reference, previewImage, data.type)
                                setProgress(100)
                                setShow(false)
                                done("Done")
                            }
                        }
                    }

                }
                else {
                    Toast.error("Please select a file or enter a url")
                    nope("No files selected")
                }
            } catch (e) {
                Toast.error("Unable to upload the file. Something went wrong")
                nope("err")
            }


        })
    }

    const headerContent = <div className="file-uploaded-header">
        <div className="title">
            <div className="icon"></div>
            <div className="text">File Uploader</div>
        </div>
    </div>

    return (<>
        <div className="dropdown-panel" onClick={() => setShow(true)} >
            {props.children}
        </div>
        <Modal
            title="File Uploader"
            show={show}
            onClose={() => { setShow(false); } }
            className="file-uploader"
            headerContent={headerContent}
            backgroundDismiss={false}
        >

            {/* uploader */}
            {view == "uploader" &&
                <div className={classNames("image-uploader")} >

                    <div className="uploader">
                        <input type="file" name="" id="" className="file-input"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <div className="preview">
                            {
                                previewImage && previewImage.trim().length > 0 ?
                                    <div style={{ backgroundImage: `url(${previewImage})` }} className="preview-image" ></div>
                                    :
                                    <div className={classNames("default-message")}>
                                        <div className="icon-cont">
                                            <div className="icon"></div>
                                        </div>
                                        <div className="message">Drag & Drop or Click</div>
                                    </div>
                            }
                        </div>

                    </div>

                    <div className="footer">
                        <div className="url-input">
                        </div>

                        <AsyncButton
                            title="Upload"
                            loadingTitle={`Uploaded ${progress}% is completed...`}
                            onClick={onClickUpload}
                            className="upload-btn"
                            active={(data.file) ? true : false}
                        />
                    </div>

                </div>
            }
        </Modal>
    </>)

}

FileUploader.defaultProps = {
    allowedTypes: []
}

export default FileUploader

