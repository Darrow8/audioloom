import React, { useState, useEffect, useCallback } from 'react';
import { View, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import {
	GoogleSignin,
	GoogleSigninButton,
	statusCodes,
	User,
	isSuccessResponse,
	isErrorWithCode
} from '@react-native-google-signin/google-signin';
import { GDrive } from '@robinbobin/react-native-google-drive-api-wrapper';
import { env } from '@/config/env';
import DriveList, { DriveFile } from './DriveList';
import AsyncStorage from '@react-native-async-storage/async-storage';

GoogleSignin.configure({
	scopes: ['https://www.googleapis.com/auth/drive.readonly'],
	iosClientId: env.GOOGLE_CLIENT_ID, // Get this from Google Cloud Console
});

const gdrive = new GDrive();

export const GoogleDrivePicker: React.FC<{
	onFilePick: (file: DriveFile) => void,
	allowedMimeTypes?: string[],
	maxFileSize?: number,
}> = ({ onFilePick, allowedMimeTypes, maxFileSize }) => {
	const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(true);
	const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
	const [gUser, setGUser] = useState<User | null>(null);
	const [files, setFiles] = useState<DriveFile[]>([]);
	const [nextPageToken, setNextPageToken] = useState<string | undefined>();

	useEffect(() => {
		checkSignInStatus();
	}, []);

	const checkSignInStatus = async (): Promise<void> => {
		try {
			const hasPreviousSignIn = GoogleSignin.hasPreviousSignIn();
			if (hasPreviousSignIn) {
				const currentUser = await GoogleSignin.getCurrentUser();
				setGUser(currentUser);
				await initializeDrive();
				await pickFile();
			}
			setIsSignedIn(hasPreviousSignIn);
		} catch (error) {
			console.error('Error checking sign in status:', error);
		} finally {
			setLoading(false);
		}
	};

	const initializeDrive = async (): Promise<void> => {
		try {
			const tokens = await GoogleSignin.getTokens();
			console.log('tokens', tokens)
			gdrive.accessToken = tokens.accessToken;
		} catch (error) {
			console.error('Error initializing Google Drive:', error);
			Alert.alert('Error', 'Failed to initialize Google Drive');
		}
	};

	const signIn = async (): Promise<void> => {
		try {
			setLoading(true);
			await GoogleSignin.hasPlayServices();
			const userInfo = await GoogleSignin.signIn();
			if (isSuccessResponse(userInfo)) {
				setGUser(userInfo.data);
			}
			setIsSignedIn(true);
			await initializeDrive();
			await pickFile();
		} catch (error: any) {
			if (error.code === statusCodes.SIGN_IN_CANCELLED) {
				Alert.alert('Cancelled', 'Sign in was cancelled');
			} else if (error.code === statusCodes.IN_PROGRESS) {
				Alert.alert('In Progress', 'Sign in is in progress');
			} else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
				Alert.alert('Error', 'Play services not available');
			} else {
				Alert.alert('Error', 'An unknown error occurred');
				console.error('Sign in error:', error);
			}
		} finally {
			setLoading(false);
		}
	};

	const signOut = async (): Promise<void> => {
		try {
			setLoading(true);
			await GoogleSignin.signOut();
			setGUser(null);
			setIsSignedIn(false);
			gdrive.accessToken = '';
		} catch (error) {
			console.error('Error signing out:', error);
			Alert.alert('Error', 'Failed to sign out');
		} finally {
			setLoading(false);
		}
	};

	const buildQueryString = useCallback((): string => {
		const mimeTypes = [
			"'text/plain'",
			"'application/pdf'",
			"'application/vnd.openxmlformats-officedocument.wordprocessingml.document'"
		];
		return `(${mimeTypes.map(type => `mimeType = ${type}`).join(' or ')})`;
	}, []);

	const validateFile = (file: DriveFile): boolean => {
		if (maxFileSize && file.size > maxFileSize) {
			Alert.alert('Error', 'File size exceeds maximum allowed size');
			return false;
		}

		if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimeType)) {
			Alert.alert('Error', 'File type not allowed');
			return false;
		}
		onFilePick(file);
		return true;
	};

	const pickFile = async (pageToken?: string): Promise<void> => {
		if (!gdrive) {
			Alert.alert('Error', 'Google Drive not initialized');
			return;
		}

		try {
			setLoading(!pageToken); // Only show full loading screen on initial load
			if (pageToken) setIsLoadingMore(true);

			const query = {
				q: buildQueryString(),
				fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime)',
				spaces: 'drive',
				orderBy: 'modifiedTime desc',
				pageSize: 10,
			};

			// Only add pageToken if it exists and is not undefined/null/empty
			if (pageToken && pageToken.trim()) {
				Object.assign(query, { pageToken });
			}

			const response = await gdrive.files.list(query);

			// Check if response is valid
			if (!response || typeof response !== 'object') {
				throw new Error('Invalid response from Google Drive');
			}

			const driveFiles = response.files || [];
			
			if (driveFiles.length === 0) {
				if (!pageToken) {
					Alert.alert('No Files', 'No text files found in Google Drive');
				}
				return;
			}

			const textFiles = driveFiles.map((file: DriveFile) => ({
				id: file.id,
				name: file.name,
				mimeType: file.mimeType,
				size: file.size || 0,
				modifiedTime: file.modifiedTime
			}));

			setFiles(prev => pageToken ? [...prev, ...textFiles] : textFiles);
			
			// Only set next page token if it exists and is not empty
			if (response.nextPageToken && response.nextPageToken.trim()) {
				setNextPageToken(response.nextPageToken);
			} else {
				setNextPageToken(undefined); // Clear the token if there are no more pages
			}

		} catch (error) {
			console.error('Error listing text files:', error);
			Alert.alert('Error', 'Failed to list text files from Google Drive');
			setNextPageToken(undefined); // Reset token on error
		} finally {
			setLoading(false);
			setIsLoadingMore(false);
		}
	};

	const handleLoadMore = async () => {
		if (isLoadingMore || !nextPageToken) return;
		await pickFile(nextPageToken);
	};

	if (loading) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" color="#0000ff" />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{!isSignedIn ? (
				<Button title="Sign in with Google" onPress={signIn} />
			) : (
				<View style={styles.fileListContainer}>
					<DriveList 
						files={files} 
						onFilePress={validateFile}
						onLoadMore={handleLoadMore}
						isLoadingMore={isLoadingMore}
					/>
					{/* <Button title="Sign Out" onPress={signOut} color="#FF0000" /> */}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 16,
		justifyContent: 'center',
	},
	fileListContainer: {
		// flex: 1,
		width: '100%',
	},
});
