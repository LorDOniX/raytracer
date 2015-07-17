#ifndef CAMERA_H_
#define CAMERA_H_

class Camera
{
private:
	 int width, height; // sirka vyska obrazku
	 float aspect; // pomer
	 REAL fov_y; // uhel otoceni oka
	 Vector3 eye_; // oko
	 REAL tm[3][3]; // transformacni matice
public:
	 Camera(); // konstruktor
	 Ray GenerateRay(const float sx, const float sy);
	 int Width() { return (this->width); }
	 int Height() { return (this->height); }
	 void SetWidth(int nWidth) { width = nWidth; }
	 void SetHeight(int nHeight) { height = nHeight; }
};

#endif