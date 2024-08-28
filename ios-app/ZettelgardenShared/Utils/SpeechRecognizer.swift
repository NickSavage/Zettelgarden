import AVFoundation
import Foundation
import Speech
import SwiftUI
import Combine

/// A helper for transcribing speech to text using SFSpeechRecognizer and AVAudioEngine.
public actor SpeechRecognizer: ObservableObject {
    public enum RecognizerError: Error {
        case nilRecognizer
        case notAuthorizedToRecognize
        case notPermittedToRecord
        case recognizerIsUnavailable

        var message: String {
            switch self {
            case .nilRecognizer: return "Can't initialize speech recognizer"
            case .notAuthorizedToRecognize: return "Not authorized to recognize speech"
            case .notPermittedToRecord: return "Not permitted to record audio"
            case .recognizerIsUnavailable: return "Recognizer is unavailable"
            }
        }
    }

    @Published @MainActor public var completeTranscript: String = ""
    @Published @MainActor public var transcript: String = ""
    @Published @MainActor public var isTranscribing = false

    private var audioEngine: AVAudioEngine?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private let recognizer: SFSpeechRecognizer?
    @Published @MainActor public var transcriptionTimer: Timer?

    /// Initializes a new speech recognizer. If this is the first time you've used the class, it
    /// requests access to the speech recognizer and the microphone.
    public init() {
        recognizer = SFSpeechRecognizer()
        guard recognizer != nil else {
            transcribe(RecognizerError.nilRecognizer)
            return
        }

        Task {
            do {
                guard await SFSpeechRecognizer.hasAuthorizationToRecognize() else {
                    throw RecognizerError.notAuthorizedToRecognize
                }
                guard await AVAudioSession.sharedInstance().hasPermissionToRecord() else {
                    throw RecognizerError.notPermittedToRecord
                }
            }
            catch {
                transcribe(error)
            }
        }
    }

    @MainActor public func startTranscribing() {
        isTranscribing = true
        print("starting tanscription")
        self.scheduleTranscriptionRestart()
        Task {
            await transcribe()
        }
    }

    @MainActor public func resetTranscript() {
        Task {
            await reset()
        }
    }

    @MainActor public func stopTranscribing() {
        print("stopping")

        isTranscribing = false
        self.cancelTranscriptionRestart()
        Task {
            await reset()
        }
    }
    @MainActor public func scheduleTranscriptionRestart() {
        cancelTranscriptionRestart()  // Make sure to cancel any existing timer
        transcriptionTimer = Timer.scheduledTimer(withTimeInterval: 15.0, repeats: true) {
            [weak self] _ in
            self?.restartTranscription()
        }
    }
    @MainActor public func cancelTranscriptionRestart() {
        transcriptionTimer?.invalidate()
        transcriptionTimer = nil
    }

    @MainActor public func restartTranscription() {
        print("restart")
        self.completeTranscript = self.completeTranscript + self.transcript
        stopTranscribing()
        startTranscribing()
    }
    /// Begin transcribing audio.
    ///
    /// Creates a `SFSpeechRecognitionTask` that transcribes speech to text until you call `stopTranscribing()`.
    /// The resulting transcription is continuously written to the published `transcript` property.
    private func transcribe() {
        guard let recognizer, recognizer.isAvailable else {
            self.transcribe(RecognizerError.recognizerIsUnavailable)
            return
        }

        do {
            let (audioEngine, request) = try Self.prepareEngine()
            self.audioEngine = audioEngine
            self.request = request
            self.task = recognizer.recognitionTask(
                with: request,
                resultHandler: { [weak self] result, error in
                    self?.recognitionHandler(audioEngine: audioEngine, result: result, error: error)
                }
            )
        }
        catch {
            self.reset()
            self.transcribe(error)
        }
    }

    /// Reset the speech recognizer.
    private func reset() {
        task?.cancel()
        audioEngine?.stop()
        audioEngine = nil
        request = nil
        task = nil
    }

    private static func prepareEngine() throws -> (
        AVAudioEngine, SFSpeechAudioBufferRecognitionRequest
    ) {
        let audioEngine = AVAudioEngine()

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true

        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.playAndRecord, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        let inputNode = audioEngine.inputNode

        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) {
            (buffer: AVAudioPCMBuffer, when: AVAudioTime) in
            request.append(buffer)
        }
        audioEngine.prepare()
        try audioEngine.start()

        return (audioEngine, request)
    }

    nonisolated private func recognitionHandler(
        audioEngine: AVAudioEngine,
        result: SFSpeechRecognitionResult?,
        error: Error?
    ) {
        let receivedFinalResult = result?.isFinal ?? false
        let receivedError = error != nil

        if receivedFinalResult || receivedError {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }

        if let result {
            print("Partial transcript: \(result.bestTranscription.formattedString)")
            transcribe(result.bestTranscription.formattedString)
        }
    }

    nonisolated private func transcribe(_ message: String) {
        Task { @MainActor in
            print("Updating transcript on the main thread")
            print(transcript)
            print(message)
            print(self.transcript)
            self.transcript = message
        }
    }
    nonisolated private func transcribe(_ error: Error) {
        var errorMessage = ""
        if let error = error as? RecognizerError {
            errorMessage += error.message
        }
        else {
            errorMessage += error.localizedDescription
        }
        Task { @MainActor [errorMessage] in
            transcript = "<< \(errorMessage) >>"
        }
    }
}

extension SFSpeechRecognizer {
    static public func hasAuthorizationToRecognize() async -> Bool {
        await withCheckedContinuation { continuation in
            requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }
    }
}

extension AVAudioSession {
    public func hasPermissionToRecord() async -> Bool {
        await withCheckedContinuation { continuation in
            requestRecordPermission { authorized in
                continuation.resume(returning: authorized)
            }
        }
    }
}
