## Habit Share iOS TestFlight

This project is prepared as a Capacitor iOS app and can be finished on a Mac with Xcode.

### Already prepared

- iOS project exists in `ios/App/App.xcodeproj`
- Bundle identifier is `com.habitshare.app`
- Deployment target is iOS 15.0
- Camera permission text is added for QR scanning
- Mobile web assets can be synced with `npm run ios:sync`

### Build and upload from a Mac

1. Install dependencies

```bash
npm install
```

2. Sync latest mobile assets into iOS project

```bash
npm run ios:sync
```

3. Open the iOS project in Xcode

```bash
npx cap open ios
```

4. In Xcode, open the `App` target and set:

- Team
- Unique Bundle Identifier if needed
- Signing certificate
- Version and Build number

5. Choose `Any iOS Device (arm64)` as destination

6. Create archive

- Product
- Archive

7. Upload to App Store Connect

- Distribute App
- App Store Connect
- Upload

8. In App Store Connect

- Open TestFlight
- Add internal testers first
- Add external testers after review if needed

### Important note

Actual TestFlight upload cannot be completed from Windows. Apple requires Xcode on macOS for archive and upload.
