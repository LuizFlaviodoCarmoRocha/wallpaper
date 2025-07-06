# 🌌 NASA APOD Wallpaper Carousel

![GitHub release](https://img.shields.io/github/release/LuizFlaviodoCarmoRocha/wallpaper.svg)
![GitHub issues](https://img.shields.io/github/issues/LuizFlaviodoCarmoRocha/wallpaper.svg)
![GitHub stars](https://img.shields.io/github/stars/LuizFlaviodoCarmoRocha/wallpaper.svg)

Welcome to the **NASA APOD Wallpaper Carousel**! This React TypeScript application displays NASA's Astronomy Picture of the Day (APOD) in a beautiful carousel format. You can deploy it using AWS CloudFront for a seamless experience. 

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Links](#links)

## Features

- **Daily Updates**: Get the latest astronomy picture every day.
- **Responsive Design**: Works well on both desktop and mobile devices.
- **AWS Deployment**: Utilizes AWS CloudFront for fast content delivery.
- **Customizable Carousel**: Users can navigate through images easily.
- **Open Source**: Contribute to the project and help improve it.

## Technologies Used

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A superset of JavaScript that adds static types.
- **Vite**: A fast build tool for modern web applications.
- **AWS S3**: For storing static assets.
- **AWS CloudFront**: For content delivery.
- **CSS**: For styling the application.

## Installation

To set up the project locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/LuizFlaviodoCarmoRocha/wallpaper.git
   ```

2. Navigate into the project directory:

   ```bash
   cd wallpaper
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` in your browser to see the application in action.

## Usage

The application displays NASA's Astronomy Picture of the Day. Users can navigate through images using the carousel controls. Each image comes with a title and a brief description. 

### Carousel Controls

- **Next**: Move to the next image.
- **Previous**: Move to the previous image.
- **Pause/Play**: Stop or start the automatic slideshow.

### Customization

You can customize the carousel's appearance and behavior by modifying the relevant components in the `src` directory.

## Deployment

To deploy the application, you can use AWS CloudFront. Here are the steps:

1. Build the application:

   ```bash
   npm run build
   ```

2. Upload the contents of the `dist` folder to an S3 bucket.

3. Set up CloudFront to serve the S3 bucket.

4. Access your deployed application via the CloudFront URL.

For a detailed guide on deploying with AWS, refer to the [AWS documentation](https://aws.amazon.com/documentation/).

## Contributing

We welcome contributions! If you want to help improve this project, please follow these steps:

1. Fork the repository.
2. Create a new branch:

   ```bash
   git checkout -b feature/YourFeatureName
   ```

3. Make your changes and commit them:

   ```bash
   git commit -m "Add your message here"
   ```

4. Push to your fork:

   ```bash
   git push origin feature/YourFeatureName
   ```

5. Create a pull request.

Please ensure that your code follows the project's style guidelines.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Links

For the latest releases, visit the [Releases section](https://github.com/LuizFlaviodoCarmoRocha/wallpaper/releases). You can download the latest version and execute it to explore the features.

For any issues or feature requests, check the [Issues section](https://github.com/LuizFlaviodoCarmoRocha/wallpaper/issues).

---

Thank you for checking out the NASA APOD Wallpaper Carousel! We hope you enjoy exploring the wonders of astronomy through this application. If you have any questions or feedback, feel free to reach out.