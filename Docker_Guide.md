# Build Docker Image

docker build -t careconnect .

# Run the Container

docker run -d -p 3000:3000 careconnect
