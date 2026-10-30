pipeline {
  agent any
  tools { jdk 'JDK17'; maven 'Maven3' }
  stages {
    stage('Backend tests') { steps { dir('backend') { sh 'mvn -B clean test' } } }
    stage('Frontend build') { steps { dir('frontend') { sh 'npm ci && npm run build' } } }
    stage('Build Docker images') { steps { sh 'docker compose build' } }
  }
  post { always { junit allowEmptyResults: true, testResults: 'backend/target/surefire-reports/*.xml' } }
}
