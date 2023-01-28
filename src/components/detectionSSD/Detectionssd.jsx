import React, { useRef, useState } from "react";
import styled from "styled-components";
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'


const ObjectDetectionDiv = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
`;

const DetectionDiv = styled.div`
    margin: 3rem 3rem 3rem 2rem;
    min-width: 200px;
    height: 700px;
    border: 3px solid #fff;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
`;

const PickedImg = styled.img`
    height: 100%;
    border-radius: 20px;
`;

const UploadFileInput = styled.input`
    display: none;
`;

const Title = styled.h1`
    margin-top: 1rem;
    padding: 20px;
    color: #990033;
`

const SelectBtn = styled.button`
    padding: 7px 10px;
    border: 2px solid transparent;
    background-color: #f6c2c2;
    color: #990033;
    font-size: 25px;
    font-weight: 700;
    outline: none;
    margin: 1em;
    border-radius: 10px;
    cursor: pointer;
    transition: all 260ms ease-in-out;
    &:hover {
    background-color: transparent;
    border: 2px solid #f6c2c2;
    color: #990033
    }
`;

const DisplayBox = styled.div`
    position: absolute;
    left: ${({ x }) => x + "px"};
    top: ${({ y }) => y + "px"};
    width: ${({ width }) => width + "px"};
    height: ${({ height }) => height + "px"};
    border: 7px solid #990033;
    border-radius: 20px;
    background-color: transparent;
    z-index: 20;
    &::before {
    content: "${({ classType, score }) => `${classType} ${score.toFixed(1)}%`}";
    color: white;
    background-color: #990033;
    padding: 10px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 25px;
    position: absolute;
    top: -1.5em;
    left: -5px;
    }
`;

export function Detectionssd(props) {
    const fileInputRef = useRef();
    const imageRef = useRef();
    const [imgData, setImgData] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const isEmptyPredictions = !predictions || predictions.length === 0;

    const openFilePicker = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const formatPredictions = (predictions, imgSize) => {
        if (!predictions || !imgSize || !imageRef) return predictions || [];
        return predictions.map((prediction) => {
        const { bbox } = prediction;
        const oldX = bbox[0];
        const oldY = bbox[1];
        const oldWidth = bbox[2];
        const oldHeight = bbox[3];

        const imgWidth = imageRef.current.width;
        const imgHeight = imageRef.current.height;

        const x = (oldX * imgWidth) / imgSize.width;
        const y = (oldY * imgHeight) / imgSize.height;
        const width = (oldWidth * imgWidth) / imgSize.width;
        const height = (oldHeight * imgHeight) / imgSize.height;

        return { ...prediction, bbox: [x, y, width, height] };
        });
    };

    const detectObjectsOnImage = async (imageElement, imgSize) => {
        const model = await cocoSsd.load({});
        const predictions = await model.detect(imageElement, 6);
        const newPredictions = formatPredictions(predictions, imgSize);
        setPredictions(newPredictions);
        console.log("Predictions: ", predictions);
    };

    const readImage = (file) => {
        return new Promise((rs, rj) => {
        const fileReader = new FileReader();
        fileReader.onload = () => rs(fileReader.result);
        fileReader.onerror = () => rj(fileReader.error);
        fileReader.readAsDataURL(file);
    });
    };

    const handleSelectImage = async (e) => {
    setPredictions([]);
    setIsLoading(true);

    const file = e.target.files[0];
    const imgData = await readImage(file);
    setImgData(imgData);

    const imageElement = document.createElement("img");
    imageElement.src = imgData;

    imageElement.onload = async () => {
        const imgSize = {
            width: imageElement.width,
            height: imageElement.height,
        };
        await detectObjectsOnImage(imageElement, imgSize);
        setIsLoading(false);
    };
};

    return (
        <ObjectDetectionDiv>
            <Title>Object Detection</Title>
            <DetectionDiv>
                {imgData && <PickedImg src={imgData} ref={imageRef} />}
                {!isEmptyPredictions &&
                predictions.map((prediction, idx) => (
                    <DisplayBox
                        key={idx}
                        x={prediction.bbox[0]}
                        y={prediction.bbox[1]}
                        width={prediction.bbox[2]}
                        height={prediction.bbox[3]}
                        classType={prediction.class}
                        score={prediction.score * 100}
                    />
                ))}
            </DetectionDiv>
            <UploadFileInput
                type="file"
                ref={fileInputRef}
                onChange={handleSelectImage}
                />
            <SelectBtn onClick={openFilePicker}>
                {isLoading ? "Running model..." : "Upload Image"}
            </SelectBtn>
        </ObjectDetectionDiv>
    );
}

export default Detectionssd