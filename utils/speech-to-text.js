const PROJECT_ID = process.env.PROJECT_ID
// Speech-To-Text client configurations
const encoding = 'LINEAR16';
const single_utterance = false;
var interimResults = true;
const profanityFilter = true;
const enableAutomaticPunctuation = true;
var model = '';
const sampleRateHertz = 16000;
var useEnhanced = true;
var enableWordConfidence = true;


// Google Cloud Speech service
const speech = require('@google-cloud/speech').v1p1beta1;

/**
 * Setup Cloud STT Integration
 */
function setupSTT(languageCode) {
    // Creates a client
    let speechClient = new speech.SpeechClient()
    if (speechClient && languageCode) {
        console.log(`${languageCode} Speech Client Created`)
    }

    // recognition metadata
    const recognitionMetadata = {
        interactionType: 'DISCUSSION',
        microphoneDistance: 'NEARFIELD',
        recordingDeviceType: 'PC',
        originalMediaType: 'AUDIO'
    };

    // Create the initial request object
    // When streaming, this is the first call you will
    // make, a request without the audio stream
    // which prepares Dialogflow in receiving audio
    // with a certain sampleRateHerz, encoding and languageCode
    // this needs to be in line with the audio settings
    // that are set in the client
    let requestSTT = {
        config: {
            sampleRateHertz: sampleRateHertz,
            encoding: encoding,
            languageCode: languageCode,
            metadata: recognitionMetadata,
            profanityFilter: profanityFilter,
            enableWordConfidence: enableWordConfidence,
            model: model,
            useEnhanced: useEnhanced,
            enableAutomaticPunctuation: enableAutomaticPunctuation,
        },
        singleUtterance: single_utterance,
        interimResults: interim_results,

    }

    return {
        speechCLient: speechClient,
        requestSTT: requestSTT
    }
}

/*
 * STT - Transcribe Speech on Audio Stream
 * @param audio stream
 * @param cb Callback function to execute with results
 */
function transcribeAudioStream(audio, speechClient, requestSTT, cb) {
    const recognizeStream = speechClient.streamingRecognize(requestSTT)
        .on('error', (e) => {
            console.log(e);
        })
        .on('end', () => {
            console.log('Stop');
        })
        .on('data', function (data) {
            cb(data);
            console.log('STT DATA - %s', Date.now() / 1000)
        });
    // console.log('AUDIO', typeof(audio), audio)
    // audioInput = fs.createReadStream(audio)
    // audioInput.pipe(recognizeStream)
    audio.pipe(recognizeStream);
    audio.on('end', function () {
    });
};


/*
 * STT - Transcribe Speech
 * @param audio file buffer
 */
async function transcribeAudio(audio, speechClient, requestSTT) {
    requestSTT.audio = {
        content: audio
    };
    console.log(requestSTT);
    const responses = await speechClient.recognize(requestSTT);
    return responses;
}

// Imports the Google Cloud client library
const { Translate } = require('@google-cloud/translate').v2;

// Instantiates a client
const translate = new Translate({ PROJECT_ID });

// Function to translate transcription
async function translating(userName, sourceText, target_lang) {
    // Translates some text into target language
    // console.log(`${userName}: Translating to ${target_lang}`)
    let [translation] = await translate.translate(sourceText, target_lang);
    // let [re_translation] = await translate.translate(translation, source_lz`ang);

    translation = userName + ': ' + translation
    return translation
}


// Function to translate and re-translate transcription
async function translating2(sourceText, source_lang, target_lang) {
    // Translates some text into target language
    // console.log(`${userName}: Translating to ${target_lang}`)
    let [translation] = await translate.translate(sourceText, target_lang);
    let [re_translation] = await translate.translate(translation, source_lang);

    return { translation, re_translation };
}

module.exports = {
    setupSTT,
    transcribeAudioStream
}