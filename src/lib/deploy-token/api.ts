import axios from 'axios';
import { 
  SocialLinks, 
  ContractResponse, 
  DeploymentJobResponse, 
  JobStatusResponse,
  ProjectData,
  ProjectResponse,
  VerificationParams
} from './types';

const CONTRACT_SERVER_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/contracts`;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second
let lastRequestTime = 0;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Helper function for rate limiting
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    console.log(`Rate limit active. Waiting for ${RATE_LIMIT_DELAY - timeSinceLastRequest}ms`);
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

// Helper function for retrying failed requests
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> => {
  try {
    console.log(`Attempting operation... Remaining retries: ${retries}`);
    return await operation();
  } catch (error) {
    if (retries === 0) {
      console.error("Max retries reached. Throwing error:", error);
      throw error;
    }
    console.warn(`Operation failed. Retrying in ${RETRY_DELAY}ms... Retries left: ${retries - 1}`);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return retryWithBackoff(operation, retries - 1);
  }
};

export const getContractWithSocialLinks = async (
  socialLinks: SocialLinks,
  templateNumber: number,
  tokenName: string
): Promise<ContractResponse> => {
  console.log("Fetching contract with social links:", { socialLinks, templateNumber, tokenName });
  await waitForRateLimit();
  
  return retryWithBackoff(async () => {
    try {
      const response = await axios.post<ContractResponse>(
        `${CONTRACT_SERVER_URL}/getContractWithSocialLinks`,
        { ...socialLinks, templateNumber, tokenName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log("Contract retrieved successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching contract:", error);
      throw error;
    }
  });
};

export async function verifyContract(params: VerificationParams): Promise<DeploymentJobResponse> {
  console.log("Verifying contract with params:", params);
  await waitForRateLimit();
  
  try {
    const response = await fetch(`${CONTRACT_SERVER_URL}/verify-contract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    console.log("Verification response received:", data);

    if (data.status !== "success") {
      throw new Error(data.message || "Failed to verify contract");
    }

    return data;
  } catch (error) {
    console.error("Error verifying contract:", error);
    throw error;
  }
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  console.log("Fetching job status for jobId:", jobId);
  await waitForRateLimit();
  
  return retryWithBackoff(async () => {
    try {
      const response = await fetch(`${CONTRACT_SERVER_URL}/job/${jobId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      console.log("Job status received:", data);

      if (data.status !== "success") {
        throw new Error(data.message || "Failed to get job status");
      }

      return data;
    } catch (error) {
      console.error("Error getting job status:", error);
      throw error;
    }
  });
}

export async function createProject(projectData: ProjectData): Promise<ProjectResponse> {
  console.log("Creating project with data:", projectData);
  await waitForRateLimit();
  
  return retryWithBackoff(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/projects`, {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();
      console.log("Project creation response:", data);

      if (data.status !== "success") {
        throw new Error(data?.message || "Failed to create project");
      }
      return data;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  });
}
