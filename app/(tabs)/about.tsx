import {
	View,
	StyleSheet,
	Text,
	ActivityIndicator,
	TouchableOpacity,
	Linking,
	Platform,
	Alert,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as IntentLauncher from "expo-intent-launcher";
import { useEffect, useState, useCallback } from "react";

export default function AboutScreen() {
	const [location, setLocation] = useState<Location.LocationObject | null>(
		null,
	);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [permissionStatus, setPermissionStatus] =
		useState<Location.PermissionStatus | null>(null);

	const openSettings = useCallback(async () => {
		try {
			if (Platform.OS === "ios") {
				await Linking.openURL("app-settings:");
			} else {
				// For Android
				await IntentLauncher.startActivityAsync(
					IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
					{ data: "package:com.tofiksa.StickerSmash" },
				);
			}
		} catch (error) {
			console.error("Failed to open settings:", error);
			Alert.alert(
				"Unable to open settings",
				"Please open your device settings and enable location permissions for this app manually.",
			);
		}
	}, []);

	const getLocation = useCallback(async () => {
		try {
			setIsLoading(true);
			setErrorMsg(null);

			// Check if location services are enabled
			const isLocationServicesEnabled =
				await Location.hasServicesEnabledAsync();
			if (!isLocationServicesEnabled) {
				setErrorMsg("Location services are disabled on your device");
				setPermissionStatus("undetermined" as Location.PermissionStatus);
				return;
			}

			// Request permission
			const { status } = await Location.requestForegroundPermissionsAsync();
			setPermissionStatus(status);

			if (status !== "granted") {
				setErrorMsg("Permission to access location was denied");
				return;
			}

			// Check if we're in a simulator (helpful for development)
			const isSimulator =
				Platform.OS === "ios" &&
				(__DEV__ ? !/(iPhone|iPod|iPad)/.test(navigator.platform) : false);

			const locationData = await Location.getCurrentPositionAsync({
				accuracy: isSimulator
					? Location.Accuracy.Low
					: Location.Accuracy.Balanced,
				timeInterval: 5000, // Update at most every 5 seconds
			});

			setLocation(locationData);
		} catch (error) {
			console.error("Location error:", error);
			setErrorMsg(
				`Failed to get location: ${error instanceof Error ? error.message : String(error)}`,
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		getLocation();
	}, [getLocation]);

	const handlePermissionDenied = () => {
		Alert.alert(
			"Location Permission Required",
			"This app needs location access to show your position on the map. Please grant location permission in your device settings.",
			[
				{ text: "Cancel", style: "cancel" },
				{ text: "Open Settings", onPress: openSettings },
			],
		);
	};

	const renderPermissionDenied = () => (
		<View style={styles.loadingContainer}>
			<Text style={styles.text}>
				{errorMsg || "Location permission is required to use this feature"}
			</Text>
			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={styles.button}
					onPress={() => {
						getLocation();
					}}
				>
					<Text style={styles.buttonText}>Try Again</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.button, styles.secondaryButton]}
					onPress={handlePermissionDenied}
				>
					<Text style={styles.buttonText}>Open Settings</Text>
				</TouchableOpacity>
			</View>
			<Text style={styles.helpText}>
				If you've denied permission permanently, you'll need to enable it in
				your device settings.
			</Text>
		</View>
	);

	return (
		<View style={styles.container}>
			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#ffffff" />
					<Text style={styles.text}>Loading your location...</Text>
					<Text style={styles.helpText}>
						Please accept the location permission request when prompted
					</Text>
				</View>
			) : permissionStatus !== "granted" ? (
				renderPermissionDenied()
			) : errorMsg ? (
				<View style={styles.loadingContainer}>
					<Text style={styles.text}>{errorMsg}</Text>
					<TouchableOpacity
						style={styles.button}
						onPress={() => {
							setErrorMsg(null);
							getLocation();
						}}
					>
						<Text style={styles.buttonText}>Retry</Text>
					</TouchableOpacity>
				</View>
			) : location ? (
				<MapView
					style={styles.map}
					initialRegion={{
						latitude: location.coords.latitude,
						longitude: location.coords.longitude,
						latitudeDelta: 0.0922,
						longitudeDelta: 0.0421,
					}}
				>
					<Marker
						coordinate={{
							latitude: location.coords.latitude,
							longitude: location.coords.longitude,
						}}
						title="You are here"
					/>
				</MapView>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#25292e",
	},
	map: {
		width: "100%",
		height: "100%",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: 10,
		padding: 20,
	},
	text: {
		color: "#fff",
		fontSize: 16,
		textAlign: "center",
		paddingHorizontal: 20,
	},
	helpText: {
		color: "#aaa",
		fontSize: 14,
		textAlign: "center",
		marginTop: 10,
	},
	buttonContainer: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 16,
		gap: 10,
	},
	button: {
		backgroundColor: "#4630EB",
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
		marginTop: 16,
	},
	secondaryButton: {
		backgroundColor: "#30A5EB",
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
});
