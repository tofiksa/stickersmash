import { View, StyleSheet, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState, useRef, useCallback, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as MediaLibrary from "expo-media-library";
import type { ImageSource } from "expo-image";
import { captureRef } from "react-native-view-shot";
import domtoimage from "dom-to-image";

import Button from "@/components/Button";
import ImageViewer from "@/components/ImageViewer";
import IconButton from "@/components/IconButton";
import CircleButton from "@/components/CircleButton";
import EmojiPicker from "@/components/EmojiPicker";
import EmojiList from "@/components/EmojiList";
import EmojiSticker from "@/components/EmojiSticker";

const PlaceholderImage = require("@/assets/images/background-image.png");

export default function Index() {
	const [selectedImage, setSelectedImage] = useState<string | undefined>(
		undefined,
	);
	const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
	const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
	const [pickedEmoji, setPickedEmoji] = useState<ImageSource | undefined>(
		undefined,
	);
	const [status, requestPermission] = MediaLibrary.usePermissions();
	const imageRef = useRef<View>(null);

	// Check for permissions when component mounts
	useEffect(() => {
		if (status === null) {
			requestPermission();
		}
	}, [status, requestPermission]);

	const pickImageAsync = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			quality: 1,
		});

		if (!result.canceled) {
			setSelectedImage(result.assets[0].uri);
			setShowAppOptions(true);
		} else {
			alert("You did not select any image.");
		}
	};

	const onReset = useCallback(() => {
		setShowAppOptions(false);
		setPickedEmoji(undefined);
	}, []);

	const onAddSticker = useCallback(() => {
		setIsModalVisible(true);
	}, []);

	const onModalClose = useCallback(() => {
		setIsModalVisible(false);
	}, []);

	const onSaveImageAsync = async () => {
		if (!imageRef.current) return;

		if (Platform.OS !== "web") {
			try {
				const localUri = await captureRef(imageRef, {
					height: 440,
					quality: 1,
				});

				await MediaLibrary.saveToLibraryAsync(localUri);
				alert("Saved!");
			} catch (e) {
				console.error("Error saving image:", e);
				alert("Failed to save image");
			}
		} else {
			try {
				const dataUrl = await domtoimage.toJpeg(imageRef.current, {
					quality: 0.95,
					width: 320,
					height: 440,
				});

				const link = document.createElement("a");
				link.download = "sticker-smash.jpeg";
				link.href = dataUrl;
				link.click();
			} catch (e) {
				console.error("Error saving image on web:", e);
				alert("Failed to save image");
			}
		}
	};

	const handleUseThisPhoto = useCallback(() => {
		setShowAppOptions(true);
	}, []);

	const renderFooter = () => {
		if (showAppOptions) {
			return (
				<View style={styles.optionsContainer}>
					<View style={styles.optionsRow}>
						<IconButton icon="refresh" label="Reset" onPress={onReset} />
						<CircleButton onPress={onAddSticker} />
						<IconButton
							icon="save-alt"
							label="Save"
							onPress={onSaveImageAsync}
						/>
					</View>
				</View>
			);
		}

		return (
			<View style={styles.footerContainer}>
				<Button
					theme="primary"
					label="Choose a photo"
					onPress={pickImageAsync}
				/>
				<Button label="Use this photo" onPress={handleUseThisPhoto} />
			</View>
		);
	};

	return (
		<GestureHandlerRootView style={styles.container}>
			<View style={styles.imageContainer}>
				<View ref={imageRef} collapsable={false}>
					<ImageViewer
						imgSource={PlaceholderImage}
						selectedImage={selectedImage}
					/>
					{pickedEmoji && (
						<EmojiSticker imageSize={40} stickerSource={pickedEmoji} />
					)}
				</View>
			</View>

			{renderFooter()}

			<EmojiPicker isVisible={isModalVisible} onClose={onModalClose}>
				<EmojiList onSelect={setPickedEmoji} onCloseModal={onModalClose} />
			</EmojiPicker>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#25292e",
		alignItems: "center",
	},
	imageContainer: {
		flex: 1,
	},
	footerContainer: {
		flex: 1 / 3,
		alignItems: "center",
	},
	optionsContainer: {
		position: "absolute",
		bottom: 80,
	},
	optionsRow: {
		alignItems: "center",
		flexDirection: "row",
	},
});
