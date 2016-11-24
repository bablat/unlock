# Unlock

I'm running an offsite backup box that's essentially a Raspberry Pi 3 running Raspbian, that connects to my house using certificate-based OpenVPN, prompts for a password on a clean nodejs app, then mounts my encrypted LUKS filesystem. It also send me [Pushover](https://pushover.net/) notifications whenever an attempt is made.

This package includes the interface that allows me to enter the password whenever the system reboots for whatever reason.

I leave this running at a friend's house, nobody can login to this machine even if they're connected to the network as it's not running any services listening other than SSH, and if disconnected from power the disk is encrypted.

I use [Syncthing](https://syncthing.net/) to syncronize my photos and other stuff from all of my other machines. It's great in indexing content and very traffic efficient considering the amount of data I sync.

## General Sequence:

1. Rasbian boots
1. OpenVPN dials home
1. pm2 runs this module
1. nginx serves the app
1. Push notification is sent
1. I connect and enter the correct password
1. Encrypted LUKS volume is mounted
1. Syncthing can now begin synchonizing this folder over the OpenVPN interface

Very cheap setup, at the price of an external USB HDD and a RPi.

## Requirements:

1. `/secure/mounted` file inside encrypted volume to identify a proper mount
1. `/etc/sudoers.d/unlock` configuration allowing sudo commands to run the cryptsetup and mount commands for this volume

## Pushover Configuration:

If you'd like to receive Pushover notifications then the following configuration file needs to be present:

```
/config/secret.json
```
Format is (replace with your API tokens):

```
{
    "pushover-user": "PUSHOVER-USER-TOKEN",
    "pushover-token": "PUSHOVER-APP-TOKEN"
}
```
