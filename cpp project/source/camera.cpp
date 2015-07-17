#include "stdafx.h"

Camera::Camera()
{
	 // nastaveni vsech dat
	width = 640;
	height = 480;
	fov_y = 45;
	aspect = 1.333; // 1, 1.333, 
	// matice
	eye_ = Vector3(static_cast<REAL>(-0.067), static_cast<REAL>(0.237), static_cast<REAL>(0.184));
	// matice
	tm[0][0] = static_cast<REAL>(-0.982);
	tm[0][1] = static_cast<REAL>(0.064);
	tm[0][2] = static_cast<REAL>(0.177);
	tm[1][0] = static_cast<REAL>(-0.189);
	tm[1][1] = static_cast<REAL>(-0.334);
	tm[1][2] = static_cast<REAL>(-0.924);
	tm[2][0] = static_cast<REAL>(0.0);
	tm[2][1] = static_cast<REAL>(0.940);
	tm[2][2] = static_cast<REAL>(-0.340);
}

Ray Camera::GenerateRay(const float sx, const float sy)
{
	 REAL fov_x = static_cast<REAL>(fov_y) * aspect;

	 const REAL x = ((2 * sx - (float)width) / static_cast<REAL>(width)) * tan(DEG2RAD(fov_x * 0.5));
	 
	 const REAL y = ((2 * sy - (float)height) / static_cast<REAL>(height)) * tan(DEG2RAD(fov_y * 0.5));

	 Vector3 direction = Vector3(x, -y, 1); // smer noveho paprsku
	 direction.Normalize();

	 Vector3 direction_transformed = Vector3(
		 tm[0][0]*direction.x + tm[0][1]*direction.y + tm[0][2]*direction.z,
		 tm[1][0]*direction.x + tm[1][1]*direction.y + tm[1][2]*direction.z,
		 tm[2][0]*direction.x + tm[2][1]*direction.y + tm[2][2]*direction.z);

	 // paprsek
	 Ray ray = Ray(eye_, direction_transformed);

	 // paprsek pozadi
	 Vector3 bdirection = Vector3(x, y, 1); // smer noveho paprsku
	 bdirection.Normalize();

	 Vector3 newBdirection = Vector3(
		 -1*bdirection.x + 0*bdirection.y + 0*bdirection.z,
		 0*bdirection.x + -1*bdirection.y + 0*bdirection.z,
		 0*bdirection.x + 0*bdirection.y + -0.5*bdirection.z);

	 ray.bdirection = newBdirection;

	 // vracime
	 return (ray);
}