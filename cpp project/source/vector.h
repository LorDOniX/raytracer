#ifndef VECTOR_H_
#define VECTOR_H_

struct Vector3
{
	union
	{
		struct
		{
			REAL x;
			REAL y;
			REAL z;
		};

		REAL data[3];
	};

	Vector3() : x( 0 ), y( 0 ), z( 0 )
	{
		//x = y = z = 0;
	}

	Vector3( const REAL x, const REAL y, const REAL z = 0 )
	{
		this->x = x;
		this->y = y;
		this->z = z;
	}

	REAL Norm()
	{
		return sqrt( SQR( x ) + SQR( y ) + SQR( z ) );
	}

	void Normalize()
	{
		const REAL rn = 1 / Norm();

		x *= rn;
		y *= rn;
		z *= rn;
	}

	Vector3 CrossProduct( const Vector3 & v )
	{
		return Vector3( y * v.z - z * v.y, z * v.x - x * v.z, x * v.y - y * v.x );
	}

	Vector3 Normal(Vector3 & v)
	{
		return Vector3(y * v.z - z * v.y, z * v.x - x * v.z, x * v.y - y * v.x);
	}

	REAL DotProduct( const Vector3 & v )
	{
		return x * v.x + y * v.y + z * v.z;
	}

	// je prazdny vektor
	bool IsEmpty()
	{
		if (x == 0.0 && y == 0 && z == 0) return (true);
		else return (false);
	}
};

// deklarace non-member funkcí

static Vector3 operator*( const REAL a, const Vector3 & v )
{
	return Vector3( a * v.x, a * v.y, a * v.z );
}

static Vector3 operator*( const Vector3 & v, const REAL a )
{
	return Vector3( a * v.x, a * v.y, a * v.z ); 		
}

static Vector3 operator*( const Vector3 & u, const Vector3 & v)
{
	return Vector3( u.x * v.x, u.y * v.y, u.z * v.z ); 		
}

static Vector3 operator/( const Vector3 & v, const REAL a )
{
	return v * ( 1 / a );
}

static void operator*=( Vector3 & v, const REAL a )
{
	v.x *= a;
	v.y *= a;
	v.z *= a;
}

static void operator+=( Vector3 & u, const Vector3 & v )
{
	u.x += v.x;
	u.y += v.y;
	u.z += v.z;
}

static void operator-=( Vector3 & u, const Vector3 & v )
{
	u.x -= v.x;
	u.y -= v.y;
	u.z -= v.z;
}

static Vector3 operator-( const Vector3 & v )
{
	return Vector3( -v.x, -v.y, -v.z );
}

static Vector3 operator+( Vector3 u, const Vector3 & v )
{	
	u += v;

	return u;
}

static Vector3 operator-( Vector3 u, const Vector3 & v )
{	
	u -= v;

	return u;
}

#endif
