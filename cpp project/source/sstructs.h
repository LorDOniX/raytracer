#ifndef SSTRUCTS_H_
#define SSTRUCTS_H_

struct StackData1
{
	int from, to, depth, children; // child 0 a 1
	char axis;
	Node * parent;

	StackData1() {}
	StackData1(int f, int t, int d, int c, char a, Node * p)
	{
		from = f;
		to = t;
		depth = d;
		children = c;
		axis = a;
		parent = p;
	}
};

struct StackData2
{
	Node * node;
	float t0, t1;

	StackData2() {}
	StackData2(Node * n, float tt0, float tt1)
	{
		node = n;
		t0 = tt0;
		t1 = tt1;
	}
};

#endif