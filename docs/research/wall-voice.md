# Wall voice: hearing one spoken line when someone taps + or a day

Research note, 2026-10-31, for [#83](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/83). Question: on the wall tablet, tapping + or a day should listen for one spoken line instead of opening a keyboard, and the words go to Clover exactly as a typed line does today ([#49](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/49): `conversation/process`, agent `conversation.claude_conversation`, the spoken answer shown as the echo). What is the most durable way to get that line, what does it cost to build and keep working, and what would the owner have to do?

Lines marked **[inference]** are my judgement, not something a source states. Read only: nothing on the tablet, in Fully Kiosk, or in Home Assistant was changed. Home Assistant was read through the MCP tools (state, pipeline list, `network/url`, `config/auth/list`, the Fully integration's device diagnostics); the tablet through read-only ADB queries (`getprop`, `settings get`, `ime list`, `dumpsys package`, `cmd package query-services`; Fully stayed in front throughout). Source code was read at the versions the house runs: Home Assistant core tag `2026.10.4`, Chromium tag `156.0.8078.47` (the tablet's WebView), and the Home Assistant frontend's `dev` branch (read 2026-10-31).

## Answer

**Recommended: the browser's own speech recognition (the Web Speech API, `SpeechRecognition`) inside Fully, on the page as served today (plain http), after one five-minute test on the wall.** WebView 156 supports speech recognition. It hands the microphone request to Fully and the listening to Android's own recognizer (Speech Services by Google, installed). Unlike `getUserMedia`, nothing in that path requires https. So the wall can keep its local address, its sign-in and its offline display. The board gets plain text back and sends it through the typed path unchanged. The one unknown is whether Fully grants the microphone to an http page: its documentation says microphone access is "only possible from secure origin websites", and that sentence may describe only `getUserMedia`. Only a test can tell.

**Fallback, working today with no build: Gboard's microphone key.** The tablet's keyboard is Gboard 18.4.6 with voice typing installed. The touches are + (the field opens with the keyboard), the mic key, speak, then send: three taps instead of one. The board also uses this as its automatic fallback whenever recognition errors.

**Not recommended unless the test fails and the owner accepts the trade:** Home Assistant's own voice pipeline from the page (Cloud speech-to-text, the house's chosen engine). It needs https at the wall, and the only https the house has today is the Nabu Casa address. That makes the wall's display depend on the internet and requires turning off "Local access only" for the Clover user.

## 0. What's already built and decided

- **The typed path** ([#49](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/49), 2026-10-31): the card sends a line to Clover with `conversation/process` (agent `conversation.claude_conversation`) and shows the answer as the echo. Voice should end in this same call. The house board's layout ([#44](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/44#issuecomment-6512692169)) is plain ES modules with no build step, and `ha.js` is the only file that calls Home Assistant.
- **The Clover voice pipeline** (read 2026-10-31, `ha_manage_pipeline list`): id `01m5qdcd0wqh3eea05efqwjdzv`, the preferred pipeline. It uses speech-to-text `stt.home_assistant_cloud` (en-US), text-to-speech `tts.home_assistant_cloud` (AmberNeural), and conversation agent `conversation.claude_conversation`, with "prefer handling commands locally" on and no wake word. Home Assistant Cloud speech-to-text is the house's choice ([J006, Speech engines](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J006-home-assistant-automations.md)).
- **Home Assistant** 2026.10.4. `network/url`: internal `http://192.168.4.58`; external and cloud are the house's `https://….ui.nabu.casa` address (`binary_sensor.remote_ui` on). The wall's user **Clover** is non-admin (`system-users`) and **`local_only: true`** (`config/auth/list`).
- **The tablet** (read over ADB, 2026-10-31):

| Item | Value |
|---|---|
| Android | 15 (SDK 35), security patch 2026-01-05, build type `user`, `ro.debuggable` 0 |
| WebView in use | `com.google.android.webview` 156.0.8078.47 |
| Fully Kiosk Browser | 1.61.4-play (PLUS, per J006) |
| Default keyboard | Gboard (`com.google.android.inputmethod.latin`) 18.4.6.985164140 |
| Other input method enabled | Google voice input (`com.google.android.tts/…VoiceInputMethodService`) |
| System speech recognizer | `com.google.android.tts/…GoogleTTSRecognitionService` (Speech Services by Google, build `googletts…20260928`); also Android System Intelligence's on-device `AiAiSpeechRecognitionService` |
| Assistant | Google app (`googlequicksearchbox`) 17.70.11 |
| Home Assistant companion app | not installed |
| Fully's Android permissions | `RECORD_AUDIO` granted (user set), `CAMERA` granted, `MODIFY_AUDIO_SETTINGS` granted |
| Package visibility | Speech Services by Google is force-queryable, so Fully can see the recognizer (`dumpsys package queries`) |

- **Fully's settings** (read through Home Assistant's Fully integration, which fetches them with `getSettings()` ([coordinator.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/fully_kiosk/coordinator.py#L51)); secrets are redacted in the diagnostics): `microphoneAccess` **false**, `webcamAccess` false, `ignoreSSLerrors` false, `websiteIntegration` (JavaScript interface) false, `softKeyboard` true, `forceShowKeyboard` false, `forceHideKeyboard` false, `motionDetectionAcoustic` false, `audioRecordUploads` false, `enableLocalhost` false, `webviewMixedContent` "2", `waitInternetOnReload` true, `autoplayAudio` false, `kioskMode` false. **[inference]** Android's `RECORD_AUDIO` grant suggests the microphone was allowed once in setup, but Fully's own web microphone switch is off now.

## 1. Can the board page get the microphone as served today?

**`getUserMedia` (raw audio): no, not at `http://192.168.4.58`.**
- Home Assistant's own Assist microphone checks `window.isSecureContext && "AudioContext" in window` ([audio-recorder.ts](https://github.com/home-assistant/frontend/blob/dev/src/util/audio-recorder.ts), `isSupported`). Otherwise it shows "Your browser blocks the microphone because your connection to Home Assistant is not secured using HTTPS." ([en.json](https://github.com/home-assistant/frontend/blob/dev/src/translations/en.json), `ui.components.secure_connection_required.microphone`).
- Fully's own documentation agrees. **Enable Microphone Access (PLUS)**: "allow accessing microphone by websites using HTML5 techniques (Android 5+)", "Only possible from secure origin websites (loaded by HTTPS)" ([Fully, Web Content Settings](https://www.fully-kiosk.com/docs/en/configuration/web-content)).

**The Web Speech API (recognized text, not audio): possibly yes, untested.**
- Blink's `SpeechRecognition` interface carries no `[SecureContext]`. It is exposed as `SpeechRecognition` and `webkitSpeechRecognition`, and both runtime features are "stable" at 156 ([speech_recognition.idl](https://chromium.googlesource.com/chromium/src/+/refs/tags/156.0.8078.47/third_party/blink/renderer/modules/speech/speech_recognition.idl), [runtime_enabled_features.json5](https://chromium.googlesource.com/chromium/src/+/refs/tags/156.0.8078.47/third_party/blink/renderer/platform/runtime_enabled_features.json5)).
- WebView turns off speech *synthesis* only: "WebView does not currently support Web Speech Synthesis API, but it does support Web Speech Recognition API (crbug.com/487255)" ([aw_main_delegate.cc](https://chromium.googlesource.com/chromium/src/+/refs/tags/156.0.8078.47/android_webview/lib/aw_main_delegate.cc), lines 142 to 144). WebView supplies its own recognition delegate, `AwSpeechRecognitionManagerDelegate`.
- **Permission:** before listening, Chromium makes a media access request ([speech_recognition_manager_impl.cc](https://chromium.googlesource.com/chromium/src/+/refs/tags/156.0.8078.47/content/browser/speech/speech_recognition_manager_impl.cc), `RecognitionAllowedCallback`, `MakeMediaAccessRequest`). In WebView that goes to the app as a `MediaAccessPermissionRequest` through `onPermissionRequest` ([aw_web_contents_delegate.cc](https://chromium.googlesource.com/chromium/src/+/refs/tags/156.0.8078.47/android_webview/browser/aw_web_contents_delegate.cc), `RequestMediaAccessPermission`; [media_access_permission_request.cc](https://chromium.googlesource.com/chromium/src/+/refs/tags/156.0.8078.47/android_webview/browser/permission/media_access_permission_request.cc)). Neither file, nor `MediaStreamManager::MakeMediaAccessRequest`, checks the page's scheme. **So whether an http page gets the microphone is Fully's decision.** Fully grants web microphone requests only when Enable Microphone Access is on (now off). Whether it also refuses http pages isn't documented: that's the test in [section 6](#6-recommendation).
- **The recognizer:** on Android 12 and later, Chromium uses Speech Services by Google (`com.google.android.tts`) through Android's `SpeechRecognizer` ([SpeechRecognitionImpl.java](https://chromium.googlesource.com/chromium/src/+/refs/tags/156.0.8078.47/content/public/android/java/src/org/chromium/content/browser/SpeechRecognitionImpl.java), lines 50 and 206). That package is installed and is the tablet's default recognizer. A single-phrase session (`continuous = false`) ends on its own when the speaker stops.

**What https at the wall would take, and what it changes:**

| Route | What it takes | What it changes |
|---|---|---|
| **Nabu Casa address** (exists today) | Fully start URL to `https://….ui.nabu.casa/<dashboard>`; Fully Enable Microphone Access on; **turn off "Local access only" for Clover**, because Home Assistant refuses local-only users on cloud connections ([auth_util.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/http/auth_util.py#L32)); sign Clover in once on the wall | Every byte of the board goes out to Nabu Casa's relay and back. The relay is TCP-level and TLS ends on the Green ([Nabu Casa, Remote access deep dive](https://support.nabucasa.com/hc/en-us/articles/25619268678557)). **[inference]** With the internet or Nabu Casa down, the wall can't load or update; today it shows local data without internet. The board becomes a new "copy" because its browser storage is per address, so its device id, view settings, name and theme override start fresh ([card-map](../agents/card-map.md#browser-storage-keys-per-copy)). Clover's password then works from the internet. No Home Assistant automation, script or helper mentions `192.168.4.58` (search 2026-10-31). On the tablet only [ha-token-from-board.py](https://github.com/bellamy1506/Clover-Home/blob/main/systems/clover-tablet/ha-token-from-board.py) looks for the old address. The Fully integration, the screen camera, ADB and the job service don't use the board's address |
| **Local certificate, self-signed** | The NGINX SSL proxy app on port 443 (plus `trusted_proxies` in `configuration.yaml`), a self-signed certificate for `192.168.4.58`, and Fully's **Ignore SSL Errors** ([Fully, Advanced Web Settings](https://www.fully-kiosk.com/docs/en/configuration/advanced-web): "this makes TLS/SSL absolutely unsafe of course") | **Unverified:** whether WebView treats a page loaded past a certificate error as a secure context, and whether Home Assistant's websocket connects under the same override. A third-party release note says ignoring errors "does not create a true secure context" ([knoop7/Ava-Pro 0.3.7](https://github.com/knoop7/Ava-Pro/releases/tag/0.3.7)); a Mozilla bug notes the override does satisfy the scheme check ([bug 1162772](https://bugzilla.mozilla.org/show_bug.cgi?id=1162772)). It adds an app and a config change to keep. Changing Home Assistant's own `http:` to TLS instead would break every local `http://` client (the phones' internal URL, the job service's `ws://192.168.4.58`) |
| **Local certificate, trusted** | A domain the owner controls, a Let's Encrypt certificate by DNS challenge, and a public DNS name pointing at `192.168.4.58` | Certificate renewal to keep working; whether eero answers a public name with a private address is unknown. More moving parts than the house wants |
| **"Treat this http address as secure" flag** | Not available. WebView reads command-line flags only on `userdebug`/`eng` builds ([commandline-flags.md](https://chromium.googlesource.com/chromium/src/+/refs/tags/156.0.8078.47/android_webview/docs/commandline-flags.md)), and this tablet is `user`. The flags WebView DevTools may toggle on production devices don't include it ([ProductionSupportedFlagList.java](https://chromium.googlesource.com/chromium/src/+/refs/tags/156.0.8078.47/android_webview/java/src/org/chromium/android_webview/common/ProductionSupportedFlagList.java)) | n/a |
| **Serve the board from `http://127.0.0.1`** through a forwarder in Termux | `localhost` counts as secure, so no certificate would be needed | **[inference]** The wall's display would depend on Termux staying alive, the tablet's most fragile part (see the wake-lock history in the clover-tablet skill's reference). Rejected |

## 2. Fully Kiosk's own speech or microphone features

- **JavaScript interface (PLUS):** text-to-speech only (`fully.textToSpeech`, `stopTextToSpeech`, `initTts` 1.55+, `shutdownTts` 1.60+, `tts*` events). There are no recognition or microphone functions ([Fully, JavaScript Interface](https://www.fully-kiosk.com/docs/en/api/javascript)). The interface is off on the wall (`websiteIntegration` false) and isn't needed for the recommendation.
- **Settings:** Enable Microphone Access (PLUS, off); Enable Audio Record Upload (PLUS, off), which records a file to upload into a form; Enable Acoustic Motion Detection, which "seems to fail with Android 11+ on some devices" ([Fully, Motion Detection](https://www.fully-kiosk.com/docs/en/configuration/motion-detection)).
- **[inference]** Audio Record Upload is a dead end. It hands off to a recorder app (the tablet has `com.tcl.ai.recorder`) and returns a file, which costs more touches. Home Assistant's speech-to-text REST endpoint takes WAV or OGG, and recorder apps usually save M4A.
- **Fully's microphone switch can be flipped remotely** with Home Assistant's `fully_kiosk.set_config` (key `microphoneAccess`), the same way sessions already flip `webviewDebugging` (clover-tablet skill). That's a Home Assistant action, so it needs the owner's approval.

## 3. Home Assistant's voice path from a page

What the page sends, from Home Assistant 2026.10.4's source and the frontend's Assist chat ([ha-assist-chat.ts](https://github.com/home-assistant/frontend/blob/dev/src/components/ha-assist-chat.ts), `_startListening`, `_sendAudioChunk`):

1. **Start:** websocket command `assist_pipeline/run` with `start_stage: "stt"`, `end_stage: "stt"`, `input: {sample_rate: <AudioContext rate>}`, `pipeline: "01m5qdcd0wqh3eea05efqwjdzv"` ([websocket_api.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/assist_pipeline/websocket_api.py#L66)). Ending at `stt` is allowed: a run only fails if the end stage comes before the start ([run.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/assist_pipeline/run.py#L139)). **The command isn't admin-only** (only the debug, device-list and capture commands are, from line 274 on), so the non-admin Clover user can run it.
2. **Audio:** after the `run-start` event, which carries `runner_data.stt_binary_handler_id`, the page sends binary websocket frames. Each frame is one byte of handler id followed by 16-bit signed little-endian mono PCM at the page's own sample rate. The frontend's worklet converts the microphone's Float32 samples to Int16 ([recorder-worklet.js](https://github.com/home-assistant/frontend/blob/dev/src/util/recorder-worklet.js)). Home Assistant resamples to 16 kHz itself with `audioop.ratecv` ([websocket_api.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/assist_pipeline/websocket_api.py#L172); `SAMPLE_RATE = 16000` in [const.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/assist_pipeline/const.py#L20)). A frame with only the id byte ends the stream.
3. **End of phrase:** Home Assistant decides, so the page doesn't have to. Cloud speech-to-text declares `requires_external_vad=True` for both its engines ([cloud/stt.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/cloud/stt.py#L44)). The pipeline therefore runs its own voice detector ([default_pipeline.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/assist_pipeline/default_pipeline.py#L440)). The detector needs at least 1.0 s of command, stops after **0.7 s of silence**, and gives up at 15 s ([vad.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/assist_pipeline/vad.py#L79); "relaxed" is 1.25 s and "aggressive" 0.25 s, a per-satellite setting). Events: `stt-start`, `stt-vad-start`, `stt-vad-end`, then `stt-end` with `stt_output.text`, or the error `stt-no-text-recognized`.
4. **Then:** the board sends that text through `conversation/process` exactly as a typed line. **[inference]** Stopping the pipeline at `stt` matters: running it on to `intent` would apply the pipeline's "prefer handling commands locally" first, which the typed path doesn't do.

**Home Assistant Cloud speech-to-text:** Microsoft Azure by default. The opt-in Labs feature (Home Assistant 2026.9+) uses Soniox through a Nabu Casa proxy that "does not process, store, or log your audio" ([Nabu Casa, Speech-to-text](https://support.nabucasa.com/hc/en-us/articles/29718084245149); [cloud strings.json](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/cloud/strings.json)). It's already paid for.

**Latency:** no published figure found. The pipeline's debug store held no runs since the 1:23 pm restart, so none could be read. **[inference]** After the speaker stops: 0.7 s of silence, a fraction of a second for the cloud's final text, then Clover's usual answer time. J006 estimates 2 to 4 s for Assist on the iPhone.

**Cost to build and keep:** about 80 to 120 lines plus a copied worklet file. **[inference]** The upkeep is the https route above. Owner's part: the Nabu Casa route's sign-in change and internet dependence, or a local-certificate project.

## 4. The keyboard's microphone

- **Keyboard:** Gboard 18.4.6 is the default. Google's voice input method is also enabled, and the recognizer is Speech Services by Google (section 0).
- **How:** "tap a text field, then tap the microphone at the top of the keyboard … When you see 'Speak now,' say what you want written" ([Gboard Help, voice typing](https://support.google.com/gboard/answer/2781851?hl=en&co=GENIE.Platform%3DAndroid)). Fully allows the soft keyboard (`softKeyboard` true).
- **Touches:** + (the board focuses its field, so the keyboard opens), the mic key, speak, then Go or the board's send: **three taps**. **[inference]** Gboard ends dictation on a pause or a tap. The board can't tell dictation from typing, so it can't auto-send safely.
- **Online or offline:** Google's service, online unless an offline English pack is installed. Not checked: Gboard's and Speech Services' preferences aren't readable over ADB.
- **Works today:** **[inference]** yes, with no build. Not yet seen on the wall: whether the mic key shows on its keyboard.

## 5. Other tap-to-talk without a wake word

- **Home Assistant companion app** (not installed): native Assist with the phone's own microphone. It needs no https, can be the default digital assistant, and has had experimental wake words since 2026.2.3 ([Assist on Android](https://www.home-assistant.io/voice_control/android/)). **[inference]** Its Assist dialog runs the Clover pipeline itself, so the board never sees the words or shows its echo. Using it means switching apps on the wall, or replacing Fully and losing the Fully integration's 33 entities. Not a fit.
- **Home Assistant Voice Preview Edition** ($69, J006): "To activate Assist, you can also just press the center button" ([Nabu Casa, conversing without a wake word](https://support.nabucasa.com/hc/en-us/articles/25775805328029)). Home Assistant can also make it listen with `assist_satellite.start_conversation` ([J006](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J006-home-assistant-automations.md)). **[inference]** That means a second device by the wall, and its answer is spoken. Showing the words on the board would need more building. It's a good kitchen voice, not a fit for "tap the day".
- **View Assist Companion App** (community): an Android satellite app that replaces the kiosk browser ([View Assist](https://github.com/dinki/View-Assist)). Not a fit for the same reason.
- **Android's speech dialog through an intent URL:** the result returns to Fully, not to the page. Dead end.

## 6. Comparison and recommendation

| Way | Works today? | What it needs | Touches | Wait after speaking | Upkeep | Privacy |
|---|---|---|---|---|---|---|
| **A. Web Speech API in Fully (http)** | Unknown until a 5-minute test | Fully Enable Microphone Access on; about 40 to 60 lines (`voice.js`) and a node test with a fake recognizer | 1 tap, speak | **[inference]** the recognizer's own pause detection, then Clover | None scheduled; WebView and Speech Services update from the Play Store; failures fall back to the keyboard | Audio to Google's speech service (on-device if an offline pack is used, unverified) |
| **B. Gboard mic key** | **Yes** **[inference]** | Nothing | 3 taps, speak | When the speaker taps send | None | Google, as A |
| **C. HA pipeline over the Nabu Casa address** | No | https at the wall (start URL change, Clover not local-only, re-sign-in), Fully microphone on, about 80 to 120 lines | 1 tap, speak | 0.7 s silence, then cloud text, then Clover | Wall display depends on internet and the subscription; a remote-capable Clover login | Audio to Nabu Casa, then Azure (or Soniox) |
| **D. HA pipeline over local https** | No | NGINX app, a certificate, Ignore SSL Errors, `configuration.yaml` change; unverified secure context | 1 tap, speak | As C | An app, a config change, a certificate | As C |
| **E. Companion app Assist** | No (not installed) | Install the app; app switching on the wall | 2+ taps | As C | Another app on the wall | As C |
| **F. Voice PE button** | No ($69) | A device by the wall | 1 press on the device | As C | A second device | As C |

**Recommendation: A, then B as fallback.**
- **Why A:** **[inference]** it's the only tap-to-talk route that keeps the wall on its local address, its local-only sign-in and its offline display. It needs no certificate, app or add-on. The words come back as text and go through the typed path unchanged. If WebView or Fully ever stops granting it, the board sees an error and opens the keyboard (B), so a break is visible and survivable rather than silent.
- **What A gives up:** audio goes to Google's recognizer rather than the house's Home Assistant Cloud engine.
- **Lock-in check:** no account, app or subscription, so nothing here locks the house out of Apple Home or the Home Assistant dashboard.
- **If the test fails:** keep B now. Bring C to the owner only if they accept the wall needing the internet and Clover becoming a remote-capable login.

**Cost to build A** **[inference]**: one module of about 40 to 60 lines in `house_board/`. It creates `new (window.SpeechRecognition || window.webkitSpeechRecognition)()` with `lang = "en-US"`, `interimResults = true` (shows the words as they're heard) and `continuous = false`. On the final result it calls the existing send path. On `error`, or if the API is missing, it focuses the text field instead. Add a node test with a fake recognizer and one Playwright check that the keyboard fallback appears when the API is absent (Playwright's Chromium has no speech service). It calls nothing new in Home Assistant, so `ha.js` doesn't change.

**What the owner would do for A:**
- Approve the test, and leave Fully's microphone switch on afterwards if A is chosen. That switch is a Fully setting, set through Home Assistant's `fully_kiosk.set_config`.
- Say one line at the wall during the test, if present. Not required: see step 3 below.
- Optional: download offline English speech recognition in Android settings, which may keep audio on the tablet (unverified for this path).

**The test** (a session, after approval, following the clover-tablet skill):
1. `fully_kiosk.set_config`: `microphoneAccess` true and `webviewDebugging` true.
2. Over WebView DevTools on the board page, `Runtime.evaluate`: `[typeof SpeechRecognition, typeof webkitSpeechRecognition, isSecureContext]`. Expect `"function"` and `false`.
3. Start a recognizer (`lang` en-US, `interimResults` true) and log `start`, `audiostart`, `result`, `error` and `end`.
   - `audiostart` means Fully granted the microphone to the http page. That's enough even if nobody speaks: a `no-speech` error after a few seconds still proves the microphone opened.
   - A spoken "milk" should come back as text.
   - `not-allowed` means Fully refused the http page, so A is out.
   - `service-not-allowed`, `network` or `language-not-supported` mean the recognizer failed, not the permission.
4. Set `webviewDebugging` back to false, and `microphoneAccess` back to false unless A goes ahead. Check no DevTools forward is left open and Fully is in front.

## Gaps

- **Fully's answer to a microphone request from an http page** (the deciding unknown for A). Its docs say "secure origin" only; settle it with the test above.
- **Where the recognizer runs on this tablet:** on-device or Google's servers, and whether an offline English pack is installed. Speech Services' preferences aren't readable over ADB; look in Android Settings, Languages, Voice/Speech recognition, Offline.
- **Gboard on the wall:** whether the mic key shows and whether focusing the board's field opens the keyboard. A screenshot during the first prototype settles both.
- **Cloud speech-to-text latency at this house:** no pipeline runs were in memory to read. An iPhone Action-button request followed by `assist_pipeline/pipeline_debug/get` would give real stage timings.
- **Self-signed https in Fully (route D):** whether the page is a secure context and whether the websocket connects past the ignored error. Untested; only matters if A fails and the owner prefers local over Nabu Casa.
- **Version caveat:** the Home Assistant frontend was read on `dev` (2026-10-31), not the exact 2026.10.4 frontend build. The microphone code (`audio-recorder.ts`, `recorder-worklet.js`, the pipeline call) is long-standing **[inference]**.
