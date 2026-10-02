---
title: "The Result API – Why startActivityForResult Died"
pubDate: 2026-02-27
series: "Rebooting Android Basics"
tag: ["android", "activity-result", "jetpack-compose"]
---

Modern Android uses dedicated, lifecycle-aware result contracts instead
of magic request codes and a giant catch-all callback.

## The History

``` kotlin
startActivityForResult(Intent(Intent.ACTION_PICK_IMAGES), REQUEST_CODE_GALLERY)

override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    when (requestCode) {
        REQUEST_CODE_GALLERY -> {
            if (resultCode == RESULT_OK) {
                val uri = data?.data
            }
        }
        REQUEST_CODE_CAMERA -> { /* ... */ }
        REQUEST_CODE_CONTACTS -> { /* ... */ }
    }
}
```

Everything flowed through `onActivityResult`, matched by integer codes.

## The Modern Way

### Compose

``` kotlin
@Composable
fun PhotoPickerScreen(viewModel: PhotoViewModel) {
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        uri?.let { viewModel.onImageSelected(it) }
    }

    Button(onClick = {
        launcher.launch(PickVisualMediaRequest(ImageOnly))
    }) {
        Text("Pick a Photo")
    }
}
```

### Activity/Fragment

``` kotlin
private val filePicker = registerForActivityResult(
    ActivityResultContracts.GetContent()
) { uri ->
    uri?.let { uploadFile(it) }
}
```

Built-in contracts include `PickVisualMedia`, `TakePicture`,
`GetContent`, `RequestPermission`, and `RequestMultiplePermissions`.

## The "Junior" Gotcha

Register launchers during composition / initialization, not inside click
callbacks. Registration must exist early enough for lifecycle-safe
result delivery.

## Summary

The Result API replaces request-code plumbing with typed lifecycle-aware
contracts. Register early and launch on demand.
